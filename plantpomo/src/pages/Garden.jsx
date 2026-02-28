/**
 * Garden.jsx — Isometric garden editor
 *
 * Features:
 *   • Isometric canvas matching doc/app.js BLOCK_TYPES / drawImageToCell spec
 *   • Left sidebar inventory panel showing owned plants with instance counts
 *   • Tile placement/removal is INSTANT (optimistic mutations, 0 ms latency)
 *   • Auto-saves every tile placement/removal via atomic DB RPCs
 *   • Right-click placed tile or click trash icon → remove + return instance
 *   • Beautiful toast notification system (success / warning / error)
 *   • Default quantity seeded in DB migration so fresh users see items ready
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Loader2, X, Leaf, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { plants } from "@/components/tilesData";
import { useProfile } from "@/lib/useProfile";
import { useInventory } from "@/lib/useInventory";
import { supabase } from "@/lib/supabaseClient";

// ─── Asset imports ────────────────────────────────────────────────────────────
import imgCarnation from "@/assets/PlantTiles/Carnation.png";
import imgLavander from "@/assets/PlantTiles/Lavander.png";
import imgSakura from "@/assets/PlantTiles/Sakura.png";

// ─── TILE_CONFIG (matches doc/app.js exactly) ────────────────────────────────
const TILE = {
  width: 64, height: 38, depth: 30,
  defaultImageScale: 1.22,
  minZoom: 0.4, maxZoom: 3.0,
};
const DEFAULT_CAMERA = { x: 0, y: 30, zoom: 1.2 };

// ─── BLOCK_TYPES ──────────────────────────────────────────────────────────────
const BLOCK_TYPES = {
  carnation: {
    id: "carnation", name: "Carnation",
    sprites: [{ path: imgCarnation, scale: 1.28, yOffset: 25, zIndex: 2, opacity: 1 }],
    imageScale: 1.24, yOffset: 3, opacity: 1
  },
  lavander: {
    id: "lavander", name: "Lavender",
    sprites: [{ path: imgLavander, scale: 1.30, yOffset: 28, zIndex: 2, opacity: 1 }],
    imageScale: 1.70, yOffset: 14, opacity: 1
  },
  sakura: {
    id: "sakura", name: "Sakura",
    sprites: [{ path: imgSakura, scale: 1.20, yOffset: 24, zIndex: 2, opacity: 1 }],
    imageScale: 1.34, yOffset: 5, opacity: 1
  },
  sprout: { id: "sprout", name: "Sprout", color: "#22c55e", sprites: [] },
  flower: { id: "flower", name: "Bloom", color: "#f97316", sprites: [] },
  pine: { id: "pine", name: "Pine", color: "#0ea5a4", sprites: [] },
  palm: { id: "palm", name: "Tropical Palm", color: "#65a30d", sprites: [] },
  forest: { id: "forest", name: "Ancient Oak", color: "#15803d", sprites: [] },
  frost: { id: "frost", name: "Frost Fern", color: "#38bdf8", sprites: [] },
  fire: { id: "fire", name: "Ember Root", color: "#ef4444", sprites: [] },
};

const RARITY_COLORS = {
  common: "text-slate-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  legendary: "text-purple-400",
  mythical: "text-amber-400",
};
const RARITY_BORDER = {
  common: "border-slate-600/60",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  legendary: "border-purple-500/50",
  mythical: "border-amber-500/50",
};

function collectAllPaths() {
  const s = new Set();
  for (const bt of Object.values(BLOCK_TYPES))
    (bt.sprites ?? []).forEach(sp => sp?.path && s.add(sp.path));
  return [...s];
}

function normalizeTiles(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Map();
  for (const t of raw) {
    const x = Number(t.x ?? t.grid_x), y = Number(t.y ?? t.grid_y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    seen.set(`${x},${y}`, { id: String(t.id ?? `${x},${y}`), type: String(t.type ?? t.plant_id ?? "sprout"), x, y });
  }
  return [...seen.values()];
}
function snapshotTiles(tiles) {
  return JSON.stringify([...tiles].sort((a, b) => a.x - b.x || a.y - b.y).map(t => `${t.x},${t.y},${t.type}`));
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastId = 0;
const TOAST_ICONS = { success: "✅", warning: "⚠️", error: "❌", info: "🌿" };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Garden() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const cameraRef = useRef({ ...DEFAULT_CAMERA });
  const tilesRef = useRef([]);
  const imagesRef = useRef(new Map());
  const interactionRef = useRef({ hovered: null, dragging: null, isPanning: false, panStart: null, spaceDown: false });
  const selectedTypeRef = useRef("carnation");
  const viewportRef = useRef({ width: 0, height: 0 });
  const dirtyRef = useRef(true);
  const frameRef = useRef(0);

  const [tiles, setTiles] = useState([]);
  const [zoomUi, setZoomUi] = useState(DEFAULT_CAMERA.zoom);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [toasts, setToasts] = useState([]);

  const savedSnapshotRef = useRef(snapshotTiles([]));
  const { profile } = useProfile();
  const noop = useCallback(() => { }, []);
  const { readyPlantIds, getQuantity, decrementInstance, restoreInstance, refetch: refetchInventory } =
    useInventory(profile, noop);

  const storageKey = useMemo(() => `plantpomo:garden-layout:v1:${profile?.id ?? "guest"}`, [profile?.id]);

  // Only plants in BLOCK_TYPES that have ≥ 1 available instance
  const availablePlants = useMemo(() =>
    plants.filter(p => BLOCK_TYPES[p.id] && (readyPlantIds.has(p.id) || !profile?.id)),
    [readyPlantIds, profile?.id]
  );

  const [selectedType, setSelectedType] = useState("carnation");
  const effectiveSelected = useMemo(() => {
    if (availablePlants.some(p => p.id === selectedType)) return selectedType;
    return availablePlants[0]?.id ?? "carnation";
  }, [availablePlants, selectedType]);
  useEffect(() => { selectedTypeRef.current = effectiveSelected; }, [effectiveSelected]);

  // ── Toast system ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // ── Tile state ────────────────────────────────────────────────────────────
  const commitTiles = useCallback(next => {
    tilesRef.current = next;
    setTiles(next);
    setIsDirty(snapshotTiles(next) !== savedSnapshotRef.current);
    dirtyRef.current = true;
  }, []);

  const findTileAt = useCallback((x, y) =>
    tilesRef.current.findIndex(t => t.x === x && t.y === y), []);

  const findNearestEmpty = useCallback((sx, sy, radius = 6) => {
    if (findTileAt(sx, sy) === -1) return { x: sx, y: sy };
    for (let r = 1; r <= radius; r++)
      for (let dx = -r; dx <= r; dx++)
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (findTileAt(sx + dx, sy + dy) === -1) return { x: sx + dx, y: sy + dy };
        }
    return null;
  }, [findTileAt]);

  // ── Place tile (synchronous optimistic update) ────────────────────────────
  const placeTile = useCallback((tileType, gridX, gridY, tileId) => {
    const qty = getQuantity(tileType);
    if (qty < 1 && profile?.id) {
      addToast("No instances left! Grow more in focus sessions.", "warning");
      return false;
    }
    const id = tileId ?? `t_${Math.random().toString(36).slice(2, 9)}`;
    const next = [...tilesRef.current, { id, type: tileType, x: gridX, y: gridY }];
    commitTiles(next);                // instant UI
    decrementInstance("plant", tileType);  // instant local, bg DB sync

    // Persist to DB (fire-and-forget — non-blocking)
    if (supabase && profile?.id) {
      supabase.rpc("place_garden_tile", {
        p_plant_id: tileType,
        p_grid_x: gridX,
        p_grid_y: gridY,
      }).then(({ error }) => {
        if (error) console.warn("[Garden] place_garden_tile:", error.message);
      });
    }
    return true;
  }, [getQuantity, commitTiles, decrementInstance, addToast, profile?.id]);

  // ── Remove tile (synchronous optimistic update) ───────────────────────────
  const removeTile = useCallback((gridX, gridY) => {
    const idx = findTileAt(gridX, gridY);
    if (idx === -1) return;
    const tile = tilesRef.current[idx];
    const next = [...tilesRef.current]; next.splice(idx, 1);
    commitTiles(next);                           // instant UI
    restoreInstance("plant", tile.type);         // instant local, bg DB sync
    setContextMenu(null);
    addToast(`${tile.type.charAt(0).toUpperCase() + tile.type.slice(1)} returned to inventory 🌱`, "success");

    // Persist to DB (fire-and-forget)
    if (supabase && profile?.id) {
      supabase.rpc("remove_garden_tile", {
        p_plant_id: tile.type,
        p_grid_x: gridX,
        p_grid_y: gridY,
      }).then(({ error }) => {
        if (error) console.warn("[Garden] remove_garden_tile:", error.message);
      });
    }
  }, [findTileAt, commitTiles, restoreInstance, addToast, profile?.id]);

  // ── Manual save (bulk) ────────────────────────────────────────────────────
  const saveLayout = useCallback(async () => {
    setIsSaving(true);
    const snapshot = normalizeTiles(tilesRef.current);
    // Always persist locally
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), tiles: snapshot, camera: { ...cameraRef.current } }));
    } catch { }

    if (supabase && profile?.id) {
      const { error } = await supabase.rpc("sync_garden_layout", {
        p_tiles: snapshot.map(t => ({ plant_id: t.type, grid_x: t.x, grid_y: t.y })),
      });
      if (error) {
        addToast("Save failed — check connection", "error");
        setIsSaving(false); return;
      }
    }
    savedSnapshotRef.current = snapshotTiles(snapshot);
    setIsDirty(false); setIsSaving(false);
    addToast("Garden saved ✓", "success");
  }, [storageKey, profile?.id, addToast]);

  const clearLayout = useCallback(() => {
    if (!window.confirm("Remove all tiles? They will be returned to your inventory.")) return;
    for (const tile of tilesRef.current) restoreInstance("plant", tile.type);
    if (supabase && profile?.id) {
      supabase.from("garden_instances").delete().eq("user_id", profile.id)
        .then(({ error }) => { if (error) console.warn("[Garden] clear:", error.message); });
    }
    commitTiles([]);
    addToast("Garden cleared — all plants returned to inventory", "info");
  }, [commitTiles, restoreInstance, addToast, profile?.id]);

  const goHome = useCallback(() => {
    if (isDirty && !window.confirm("Unsaved changes. Leave anyway?")) return;
    navigate("/");
  }, [isDirty, navigate]);

  // ── Load saved layout ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let loaded = null, parsedCamera = null;
      if (supabase && profile?.id) {
        try {
          const { data, error } = await supabase.from("garden_instances").select("plant_id,grid_x,grid_y").eq("user_id", profile.id);
          if (!error && data?.length) loaded = data.map((r, i) => ({ id: `db_${i}`, type: r.plant_id, x: Number(r.grid_x), y: Number(r.grid_y) }));
        } catch { }
      }
      if (!loaded) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) { const p = JSON.parse(raw); if (Array.isArray(p?.tiles)) { loaded = p.tiles; parsedCamera = p.camera; } }
        } catch { }
      }
      if (cancelled) return;
      const finalTiles = normalizeTiles(loaded ?? []);
      setTimeout(() => {
        if (parsedCamera) {
          cameraRef.current = {
            x: Number.isFinite(parsedCamera.x) ? parsedCamera.x : DEFAULT_CAMERA.x,
            y: Number.isFinite(parsedCamera.y) ? parsedCamera.y : DEFAULT_CAMERA.y,
            zoom: Math.min(TILE.maxZoom, Math.max(TILE.minZoom, parsedCamera.zoom || DEFAULT_CAMERA.zoom)),
          };
          setZoomUi(cameraRef.current.zoom);
        }
        tilesRef.current = finalTiles;
        setTiles(finalTiles);
        savedSnapshotRef.current = snapshotTiles(finalTiles);
        setIsDirty(false);
        dirtyRef.current = true;
      }, 0);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, profile?.id]);

  useEffect(() => {
    const h = e => { if (isDirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  useEffect(() => {
    if (!contextMenu) return;
    const h = () => setContextMenu(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, [contextMenu]);

  // ─── Canvas rendering ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (const path of collectAllPaths()) {
      if (imagesRef.current.has(path)) continue;
      const img = new Image();
      img.onload = () => { imagesRef.current.set(path, img); dirtyRef.current = true; };
      img.onerror = () => console.warn("[Garden] sprite load failed:", path);
      img.src = path;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewportRef.current = { width: w, height: h };
      dirtyRef.current = true;
    };

    const worldToScreen = (gx, gy) => {
      const { zoom, x: cx, y: cy } = cameraRef.current;
      const { width, height } = viewportRef.current;
      const cW = TILE.width * zoom, cH = TILE.height * zoom;
      return { x: (gx - gy) * (cW / 2) + cx + width / 2, y: (gx + gy) * (cH / 2) + cy + height / 2 };
    };
    const screenToWorld = (sx, sy) => {
      const { zoom, x: cx, y: cy } = cameraRef.current;
      const { width, height } = viewportRef.current;
      const cW = TILE.width * zoom, cH = TILE.height * zoom;
      const ax = sx - cx - width / 2, ay = sy - cy - height / 2;
      return { x: Math.floor((ax / (cW / 2) + ay / (cH / 2)) / 2 + 0.5), y: Math.floor((ay / (cH / 2) - ax / (cW / 2)) / 2 + 0.5) };
    };
    canvas._screenToWorld = screenToWorld;

    const diamond = (sx, sy, w, h) => {
      ctx.moveTo(sx, sy); ctx.lineTo(sx + w / 2, sy + h / 2);
      ctx.lineTo(sx, sy + h); ctx.lineTo(sx - w / 2, sy + h / 2); ctx.closePath();
    };

    const drawBase = (sx, sy, cW, cH) => {
      const d = TILE.depth * cameraRef.current.zoom;
      const g = ctx.createLinearGradient(sx, sy, sx, sy + cH);
      g.addColorStop(0, "#5dd87a"); g.addColorStop(1, "#2e8c45");
      ctx.beginPath(); diamond(sx, sy, cW, cH); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy + cH); ctx.lineTo(sx + cW / 2, sy + cH / 2);
      ctx.lineTo(sx + cW / 2, sy + cH / 2 + d); ctx.lineTo(sx, sy + cH + d);
      ctx.closePath(); ctx.fillStyle = "#7a4e28"; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy + cH); ctx.lineTo(sx - cW / 2, sy + cH / 2);
      ctx.lineTo(sx - cW / 2, sy + cH / 2 + d); ctx.lineTo(sx, sy + cH + d);
      ctx.closePath(); ctx.fillStyle = "#4a2e14"; ctx.fill();
    };

    const drawImageToCell = ({ img, sx, sy, cW, cH, imageScale = 1, yOffset = 0, opacity = 1 }) => {
      if (!img) return;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      const d = TILE.depth * cameraRef.current.zoom;
      const tW = cW, tH = cH + d;
      const asp = img.naturalWidth / img.naturalHeight, tasp = tW / tH;
      let dw, dh;
      if (asp > tasp) { dw = tW * imageScale; dh = dw / asp; }
      else { dh = tH * imageScale; dw = dh * asp; }
      ctx.save(); ctx.globalAlpha = opacity;
      ctx.drawImage(img, sx - dw / 2, sy - dh / 2 - yOffset * cameraRef.current.zoom, dw, dh);
      ctx.restore();
    };

    const drawSprites = (bt, sx, sy, cW, cH, alpha = 1) => {
      const items = (bt.sprites ?? [])
        .map((s, i) => ({ s, i, img: imagesRef.current.get(s.path) }))
        .filter(x => x.img)
        .sort((a, b) => (a.s.zIndex ?? a.i) - (b.s.zIndex ?? b.i));
      for (const { s, img } of items)
        drawImageToCell({
          img, sx, sy, cW, cH,
          imageScale: (typeof s.scale === "number") ? s.scale : (bt.imageScale ?? TILE.defaultImageScale),
          yOffset: (typeof s.yOffset === "number") ? s.yOffset : (bt.yOffset ?? 0),
          opacity: ((typeof s.opacity === "number") ? s.opacity : (bt.opacity ?? 1)) * alpha,
        });
      return items.length > 0;
    };

    const draw = () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const { width, height } = viewportRef.current;
      const { zoom } = cameraRef.current;
      const cW = TILE.width * zoom, cH = TILE.height * zoom;

      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#071520"); bg.addColorStop(1, "#020508");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);

      // Grid
      const center = screenToWorld(width / 2, height / 2);
      const range = Math.ceil(Math.max(width, height) / Math.min(cW, cH)) + 6;
      ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let gx = center.x - range; gx <= center.x + range; gx++) {
        for (let gy = center.y - range; gy <= center.y + range; gy++) {
          const { x: sx, y: sy } = worldToScreen(gx, gy);
          if (sx < -cW || sx > width + cW || sy < -cH || sy > height + cH) continue;
          ctx.beginPath(); diamond(sx, sy, cW, cH); ctx.stroke();
        }
      }
      ctx.restore();

      // Tiles (painter's sort)
      for (const tile of [...tilesRef.current].sort((a, b) => (a.x + a.y) - (b.x + b.y))) {
        const bt = BLOCK_TYPES[tile.type];
        const { x: sx, y: sy } = worldToScreen(tile.x, tile.y);
        drawBase(sx, sy, cW, cH);
        if (bt) {
          const had = drawSprites(bt, sx, sy, cW, cH);
          if (!had && bt.color) {
            ctx.save(); ctx.beginPath(); diamond(sx, sy, cW, cH);
            ctx.fillStyle = bt.color + "99"; ctx.fill(); ctx.restore();
          }
        }
      }

      // Hover + ghost preview
      const { hovered, dragging } = interactionRef.current;
      if (hovered) {
        const { x: sx, y: sy } = worldToScreen(hovered.x, hovered.y);
        if (findTileAt(hovered.x, hovered.y) === -1 && !dragging) {
          drawBase(sx, sy, cW, cH);
          const bt = BLOCK_TYPES[selectedTypeRef.current];
          if (bt) { const had = drawSprites(bt, sx, sy, cW, cH, 0.5); if (!had && bt.color) { ctx.save(); ctx.globalAlpha = 0.4; ctx.beginPath(); diamond(sx, sy, cW, cH); ctx.fillStyle = bt.color; ctx.fill(); ctx.restore(); } }
        }
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.beginPath(); diamond(sx, sy, cW, cH); ctx.fill(); ctx.restore();
      }

      // Drag preview
      if (dragging && hovered) {
        const { x: sx, y: sy } = worldToScreen(hovered.x, hovered.y);
        const bt = BLOCK_TYPES[dragging.type];
        const top = bt?.sprites?.[bt.sprites.length - 1] ?? null;
        drawBase(sx, sy, cW, cH);
        if (top && imagesRef.current.has(top.path)) {
          drawImageToCell({
            img: imagesRef.current.get(top.path), sx, sy, cW, cH,
            imageScale: (typeof top.scale === "number") ? top.scale : (bt?.imageScale ?? TILE.defaultImageScale),
            yOffset: (typeof top.yOffset === "number") ? top.yOffset : (bt?.yOffset ?? 0),
            opacity: 0.85
          });
        } else if (bt?.color) {
          ctx.save(); ctx.globalAlpha = 0.4; ctx.beginPath(); diamond(sx, sy, cW, cH);
          ctx.fillStyle = bt.color; ctx.fill(); ctx.restore();
        }
      }
    };

    const loop = () => { draw(); frameRef.current = requestAnimationFrame(loop); };

    // ── Mouse events ──────────────────────────────────────────────────────────
    const onMove = e => {
      const n = screenToWorld(e.clientX, e.clientY);
      const p = interactionRef.current.hovered;
      if (!p || p.x !== n.x || p.y !== n.y) { interactionRef.current.hovered = n; dirtyRef.current = true; }
      if (interactionRef.current.isPanning && interactionRef.current.panStart) {
        const ps = interactionRef.current.panStart;
        cameraRef.current.x = ps.cX + (e.clientX - ps.mX);
        cameraRef.current.y = ps.cY + (e.clientY - ps.mY);
        dirtyRef.current = true;
      }
    };

    const onDown = e => {
      setContextMenu(null);
      if (e.button === 1 || e.button === 2 || interactionRef.current.spaceDown) {
        interactionRef.current.isPanning = true;
        interactionRef.current.panStart = { mX: e.clientX, mY: e.clientY, cX: cameraRef.current.x, cY: cameraRef.current.y };
        canvas.style.cursor = "grabbing"; e.preventDefault(); return;
      }
      if (e.button !== 0) return;
      const grid = screenToWorld(e.clientX, e.clientY);
      const idx = findTileAt(grid.x, grid.y);
      if (idx !== -1) {
        const next = [...tilesRef.current]; const picked = next.splice(idx, 1)[0];
        tilesRef.current = next; setTiles(next); dirtyRef.current = true;
        interactionRef.current.dragging = { id: picked.id, type: picked.type, originalX: picked.x, originalY: picked.y, isNew: false };
      } else {
        interactionRef.current.dragging = { id: `t_${Math.random().toString(36).slice(2, 9)}`, type: selectedTypeRef.current, originalX: null, originalY: null, isNew: true };
      }
    };

    const onUp = e => {
      if (interactionRef.current.isPanning) {
        interactionRef.current.isPanning = false; interactionRef.current.panStart = null;
        canvas.style.cursor = interactionRef.current.spaceDown ? "grab" : "crosshair"; return;
      }
      if (e.button !== 0 || !interactionRef.current.dragging) return;
      const drop = screenToWorld(e.clientX, e.clientY);
      const dragged = interactionRef.current.dragging;
      interactionRef.current.dragging = null;

      if (dragged.isNew) {
        if (findTileAt(drop.x, drop.y) === -1) placeTile(dragged.type, drop.x, drop.y, dragged.id);
        // else: dropped on occupied — just cancel
      } else {
        // Moving an existing tile (no inventory change)
        const target = findTileAt(drop.x, drop.y) !== -1 ? findNearestEmpty(drop.x, drop.y) : drop;
        const pos = target ?? { x: dragged.originalX, y: dragged.originalY };
        commitTiles([...tilesRef.current, { id: dragged.id, type: dragged.type, x: pos.x, y: pos.y }]);
        // Update DB position (fire-and-forget)
        if (supabase && profile?.id) {
          supabase.rpc("place_garden_tile", { p_plant_id: dragged.type, p_grid_x: pos.x, p_grid_y: pos.y })
            .then(({ error }) => { if (error) console.warn("[Garden] move sync:", error.message); });
        }
      }
      dirtyRef.current = true;
    };

    const onCtxMenu = e => {
      e.preventDefault();
      const grid = screenToWorld(e.clientX, e.clientY);
      const idx = findTileAt(grid.x, grid.y);
      if (idx !== -1) {
        const t = tilesRef.current[idx];
        setContextMenu({ x: e.clientX, y: e.clientY, tileX: grid.x, tileY: grid.y, type: t.type });
      }
    };

    const onWheel = e => {
      e.preventDefault();
      const before = screenToWorld(e.clientX, e.clientY);
      const nz = Math.min(TILE.maxZoom, Math.max(TILE.minZoom, cameraRef.current.zoom - e.deltaY * 0.0018 * (e.deltaMode === 1 ? 30 : 1)));
      cameraRef.current.zoom = nz; setZoomUi(nz);
      const after = screenToWorld(e.clientX, e.clientY);
      cameraRef.current.x += (after.x - before.x) * (TILE.width * nz / 2);
      cameraRef.current.y += (after.y - before.y) * (TILE.height * nz / 2);
      dirtyRef.current = true;
    };

    const onKeyDown = e => {
      if (e.code === "Space" && !e.repeat) { interactionRef.current.spaceDown = true; canvas.style.cursor = "grab"; return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveLayout(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { const h = interactionRef.current.hovered; if (h) removeTile(h.x, h.y); return; }
      if (["[", "]", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!availablePlants.length) return;
        const cur = availablePlants.findIndex(p => p.id === selectedTypeRef.current);
        const step = (e.key === "[" || e.key === "ArrowLeft") ? -1 : 1;
        const next = availablePlants[(cur + step + availablePlants.length) % availablePlants.length];
        if (next) setSelectedType(next.id);
      }
    };
    const onKeyUp = e => { if (e.code === "Space") { interactionRef.current.spaceDown = false; canvas.style.cursor = "crosshair"; } };

    // Touch
    let td0 = null, lt = null;
    const tdist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTS = e => { if (e.touches.length === 1) lt = { x: e.touches[0].clientX, y: e.touches[0].clientY }; else if (e.touches.length === 2) td0 = tdist(e.touches); };
    const onTM = e => { e.preventDefault(); if (e.touches.length === 1 && lt) { cameraRef.current.x += e.touches[0].clientX - lt.x; cameraRef.current.y += e.touches[0].clientY - lt.y; lt = { x: e.touches[0].clientX, y: e.touches[0].clientY }; dirtyRef.current = true; } else if (e.touches.length === 2 && td0 !== null) { const d = tdist(e.touches); cameraRef.current.zoom = Math.min(TILE.maxZoom, Math.max(TILE.minZoom, cameraRef.current.zoom * (d / td0))); td0 = d; dirtyRef.current = true; } };
    const onTE = () => { lt = null; td0 = null; };

    resize();
    frameRef.current = requestAnimationFrame(loop);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("contextmenu", onCtxMenu);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTS, { passive: false });
    canvas.addEventListener("touchmove", onTM, { passive: false });
    canvas.addEventListener("touchend", onTE);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp); canvas.removeEventListener("contextmenu", onCtxMenu);
      canvas.removeEventListener("wheel", onWheel); canvas.removeEventListener("touchstart", onTS);
      canvas.removeEventListener("touchmove", onTM); canvas.removeEventListener("touchend", onTE);
      window.removeEventListener("resize", resize); window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitTiles, findNearestEmpty, findTileAt, availablePlants, saveLayout, placeTile, removeTile]);

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020508] text-white select-none font-sans">

      {/* ── Canvas ── */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" style={{ cursor: "crosshair" }} />

      {/* ── Left Inventory Sidebar ── */}
      <div className={`absolute top-0 left-0 h-full z-20 flex transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"}`}>
        <div className={`relative h-full w-64 flex flex-col border-r border-white/10 bg-[#07111c]/90 backdrop-blur-xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Leaf size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Inventory</div>
              <div className="text-[11px] text-white/40">Grown &amp; ready to plant</div>
            </div>
          </div>

          {/* Plant list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {availablePlants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <PackageOpen size={36} className="text-white/20" />
                <div className="text-sm text-white/40 leading-snug">
                  No plants ready.<br />
                  <span className="text-white/25 text-xs">Complete focus sessions to grow plants!</span>
                </div>
              </div>
            ) : (
              availablePlants.map(plant => {
                const qty = getQuantity(plant.id);
                const isSelected = effectiveSelected === plant.id;
                const isZero = qty === 0;
                return (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedType(plant.id)}
                    disabled={isZero}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-all duration-150
                      ${isSelected
                        ? "border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                        : isZero
                          ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                          : `border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 ${RARITY_BORDER[plant.rarity] ?? ""}`
                      }`}
                  >
                    {/* Plant visual */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center overflow-hidden
                      ${isSelected ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                      {plant.image
                        ? <img src={plant.image} alt={plant.name} className="w-9 h-9 object-contain" />
                        : <span className="text-2xl">{plant.icon}</span>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? "text-emerald-100" : "text-white/90"}`}>
                        {plant.name}
                      </div>
                      <div className={`text-[11px] capitalize ${RARITY_COLORS[plant.rarity] ?? "text-white/40"}`}>
                        {plant.rarity}
                      </div>
                    </div>
                    {/* Instance badge */}
                    <div className={`flex-shrink-0 min-w-[24px] h-6 flex items-center justify-center rounded-full text-[11px] font-bold px-2
                      ${isZero
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : isSelected
                          ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                          : "bg-white/10 text-white/70 border border-white/15"
                      }`}>
                      {qty}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer controls */}
          <div className="border-t border-white/10 p-3 space-y-2">
            <button onClick={clearLayout}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} /> Clear All
            </button>
            <button onClick={saveLayout} disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors">
              {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Garden</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sidebar Toggle ── */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-12 rounded-r-lg border border-white/15 bg-[#07111c]/90 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 ${sidebarOpen ? "left-64" : "left-0"}`}
      >
        {sidebarOpen ? <ChevronLeft size={14} className="text-white/60" /> : <ChevronRight size={14} className="text-white/60" />}
      </button>

      {/* ── Top bar ── */}
      <div className={`absolute top-0 right-0 z-10 flex items-center gap-3 p-4 transition-all duration-300 ${sidebarOpen ? "left-64" : "left-6"}`}>
        <button onClick={goHome}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm hover:bg-black/80 transition-colors backdrop-blur-sm">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs font-mono backdrop-blur-sm">
          <span className="text-white/50">Tiles</span>
          <span className="tabular-nums font-semibold">{tiles.length}</span>
          <span className="mx-1 text-white/15">│</span>
          <span className="text-white/50">Zoom</span>
          <span className="tabular-nums">{zoomUi.toFixed(2)}×</span>
          <span className="mx-1 text-white/15">│</span>
          {isDirty
            ? <span className="text-amber-300 font-semibold">● Unsaved</span>
            : <span className="text-emerald-400">✓ Saved</span>}
        </div>
      </div>

      {/* ── Controls hint ── */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm px-4 py-2 text-[11px] text-white/50 whitespace-nowrap">
        <span className="text-white/70 font-semibold">Click</span> place &nbsp;·&nbsp;
        <span className="text-white/70 font-semibold">Right-click</span> remove &nbsp;·&nbsp;
        <span className="text-white/70 font-semibold">Space+drag</span> pan &nbsp;·&nbsp;
        <span className="text-white/70 font-semibold">Scroll</span> zoom &nbsp;·&nbsp;
        <span className="text-white/70 font-semibold">Del</span> remove &nbsp;·&nbsp;
        <span className="text-white/70 font-semibold">Ctrl+S</span> save
      </div>

      {/* ── Right-click context menu ── */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-2xl border border-white/15 bg-[#0d1e2c]/95 shadow-2xl backdrop-blur-xl p-1.5 overflow-hidden"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 80) }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-widest">
            {contextMenu.type}
          </div>
          <button
            onClick={() => removeTile(contextMenu.tileX, contextMenu.tileY)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-colors"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/30">
              <X size={11} />
            </div>
            Remove &amp; restore to inventory
          </button>
        </div>
      )}

      {/* ── Toast notifications ── */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-300 max-w-xs
              ${toast.type === "success" ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100" :
                toast.type === "warning" ? "border-amber-400/30   bg-amber-500/15   text-amber-100" :
                  toast.type === "error" ? "border-red-400/30     bg-red-500/15     text-red-100" :
                    "border-lime-400/25    bg-lime-500/10    text-lime-100"}`}
          >
            <span className="text-base">{TOAST_ICONS[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

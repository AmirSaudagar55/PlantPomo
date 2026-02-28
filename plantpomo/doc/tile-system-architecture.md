# Isometric Garden — Tile Rendering Architecture

> **Reference implementation:** `doc/app.js`  
> **Live component:** `src/pages/Garden.jsx`  
> **Asset folder:** `src/assets/PlantTiles/`

---

## 1. The Goal

Adjacent tiles must **touch with zero gaps**, looking like a contiguous piece of land (as in the reference screenshot and the Growdoro project). Every tile = a 3-D isometric block with a green-grass top, dirt sides, and a plant sitting on the grass.

---

## 2. Coordinate System

### Grid → Screen (`worldToScreen`)

```
screenX = (gx − gy) × (tw/2) + cameraX + viewW/2
screenY = (gx + gy) × (th/2) + cameraY + viewH/2
```

The point `(screenX, screenY)` is the **top-centre vertex** (point A) of the isometric diamond:

```
        A  ← (screenX, screenY)  ← anchor for all drawImageToCell calls
       / \
      /   \
     D     B
      \   /
       \ /
        C
```

| Vertex | Offset from A |
|--------|--------------|
| A (top)    | `(0, 0)` |
| B (right)  | `(+tw/2, +th/2)` |
| C (bottom) | `(0, +th)` |
| D (left)   | `(−tw/2, +th/2)` |

### Tile Geometry Constants (`TILE` in `Garden.jsx`)

| Constant | Value | Meaning |
|----------|-------|---------|
| `width`  | 72 px | Full diamond width A→B→C→D at zoom 1 |
| `height` | 42 px | Full diamond height A→C at zoom 1 |
| `depth`  | 20 px | Side-face extrusion (gives 3-D depth) |

> **Note:** The reference `app.js` uses `width=64, height=38, depth=30`.  
> Our values differ slightly; always use `TILE.*` constants — never hardcode numbers.

---

## 3. Rendering Layers (per tile, back-to-front)

Each tile is drawn in two distinct phases:

### Phase 1 — Programmatic 3-D Base (`drawTileBase`)

Because we do not have `dirt-bright.png` / `grass.png` sprite sheets, the base block
is drawn with pure canvas calls:

- **Top face** — green gradient diamond (`diamondPath`)
- **Right side** — medium brown trapezoid (depth extrusion)
- **Left side** — dark brown trapezoid (depth extrusion, more shadow)

This draws the tile footprint and must be pixel-perfect so adjacent tiles share edges with no gap.

### Phase 2 — Plant Sprite (`drawImageToCell` → `drawBlock`)

After the base, one or more sprites are drawn in `zIndex` order.  
Each sprite's position is calculated by `drawImageToCell`.

---

## 4. `drawImageToCell` — The Core Fitting Algorithm

Identical to the `app.js` reference function. Given:

- `(screenX, screenY)` = top-centre vertex of the target cell
- `tw, th` = tile width/height at current zoom
- `imageScale` = per-sprite scale multiplier
- `yOffset` = CSS-px upward shift at zoom 1

**Algorithm:**

```
depth     = TILE.depth × zoom
targetW   = tw                    // fit into the full diamond width
targetH   = th + depth            // fit from top vertex to bottom of side face

// Maintain aspect ratio, scale by imageScale:
if (imgAspect > targetW/targetH)
    dw = targetW × imageScale
    dh = dw / imgAspect
else
    dh = targetH × imageScale
    dw = dh × imgAspect

// Anchor image centre at the TOP-CENTRE vertex, shifted up by yOffset:
drawX = screenX − dw/2
drawY = screenY − dh/2 − yOffset × zoom
```

**Key insight:** `yOffset` is defined in CSS-px at zoom=1. Positive = plant grows upward above the tile. Negative = image shifts downward (used for base sprites to sink into the grid plane).

---

## 5. `BLOCK_TYPES` Configuration Reference

```js
const BLOCK_TYPES = {
  carnation: {
    id: 'carnation',
    name: 'Carnation',
    sprites: [
      // zIndex 0: would be dirt-bright.png (not available, skipped)
      // zIndex 1: would be grass.png        (not available, skipped)
      // zIndex 2: the actual plant PNG
      { path: imgCarnation, scale: 1.28, yOffset: 25, zIndex: 2, opacity: 1 },
    ],
    // Block-level fallbacks (if a sprite omits scale/yOffset/opacity):
    imageScale: 1.24,
    yOffset: 3,
    opacity: 1,
  },
};
```

### Field Reference

| Field | Type | Meaning |
|-------|------|---------|
| `sprites[].path` | string URL | Vite-imported image URL (`import img from '…'`) |
| `sprites[].scale` | number | Override scale for this sprite (overrides `imageScale`) |
| `sprites[].yOffset` | number | CSS-px upward shift for this sprite (overrides block `yOffset`) |
| `sprites[].opacity` | 0–1 | Per-sprite opacity |
| `sprites[].zIndex` | number | Draw order (lower = drawn first, underneath) |
| `imageScale` | number | Default scale used when sprite omits `scale` |
| `yOffset` | number | Default yOffset used when sprite omits `yOffset` |
| `opacity` | number | Default opacity (0–1) |
| `color` | string | CSS colour for colour-blob fallback (plants without images) |

---

## 6. Tuning `scale` and `yOffset` for New Assets

### The Alignment Rule

For tiles to **touch seamlessly**, the bottom of the rendered image must align with the bottom of the 3-D base block (i.e., the very bottom of the depth face = `screenY + th + depth × zoom`).

The image bottom is at:
```
imageBottom = drawY + dh
            = (screenY − dh/2 − yOffset×zoom) + dh
            = screenY + dh/2 − yOffset×zoom
```

For it to sit on the grass surface (top face centre = `screenY + th/2`):
```
imageBottom ≈ screenY + th/2 + some overhang
```

### Step-by-Step Tuning Guide

When adding a **new plant image** (`W × H` pixels):

1. **Start with `scale = 1.0`, `yOffset = 0`** and place a tile.

2. **Check the image bottom**: The plant image should appear to sit on the grass surface, not float above or sink below it.

3. **Adjust `yOffset`**:
   - If the plant floats **above** the grass → **decrease `yOffset`** (move image down)
   - If the plant sinks **below** the grass → **increase `yOffset`** (move image up)
   - Typical range: `0–30` for plants, `-10–0` for base textures

4. **Adjust `scale`**:
   - If there are **visible grid gaps** between adjacent tiles → **increase `scale`** slightly above 1.0 (extends image to cover seam)
   - If the plant image **overlaps too aggressively** onto neighbours → **decrease `scale`**
   - Typical range: `1.0–1.35` for plants

5. **Check at multiple zoom levels** (zoom in / out with scroll). If the tile looks wrong at non-1.0 zoom but correct at zoom=1, re-check that you are using `yOffset × zoom` (not `yOffset` directly) in `drawImageToCell`.

### Known Working Values (app.js Reference)

From the reference app.js and Growdoro TypeScript definitions (TILE_CONFIG: 64×38, depth 30):

| Plant | `scale` | `yOffset` | Image size (px) |
|-------|---------|-----------|-----------------|
| Carnation | 1.20–1.28 | 24–25 | 763×937 |
| Lavender  | 1.30      | 28    | 1016×1024 |
| Sakura (Marigold equiv.) | 1.20 | 24 | 767×951 |
| Sunflower | 1.20 | 30 | — |
| Bird of Paradise | 1.20 | 26 | — |

> Our `TILE` constants are slightly larger (72×42 vs 64×38), so these values may need marginal scaling.

---

## 7. Adding a New Plant — Checklist

```
1. Put the PNG in src/assets/PlantTiles/<Name>.png
2. Add Vite import at top of Garden.jsx:
      import imgMyPlant from "@/assets/PlantTiles/MyPlant.png";
3. Add entry to BLOCK_TYPES:
      myplant: {
        id: 'myplant', name: 'My Plant',
        sprites: [
          { path: imgMyPlant, scale: 1.2, yOffset: 25, zIndex: 2, opacity: 1 },
        ],
        imageScale: 1.2, yOffset: 0, opacity: 1,
      },
4. Add entry to tilesData.jsx (for the shop / inventory):
      { id: 'myplant', name: 'My Plant', rarity: 'common', cost: 10, … }
5. Run the dev server and tune scale/yOffset using the guide above.
```

---

## 8. Common Mistakes and How to Fix Them

| Symptom | Cause | Fix |
|---------|-------|-----|
| Visible gap between tiles | `scale` too small | Increase `scale` by ~0.05 increments |
| Plant floats above tile | `yOffset` too large | Decrease `yOffset` |
| Plant sinks into tile | `yOffset` too small | Increase `yOffset` |
| Tile looks offset at high zoom | Using raw px instead of `px × zoom` | Always multiply px values by `cameraRef.current.zoom` |
| Image didn't load / tile invisible | Wrong path or CORS | Check console for `failed to load sprite:` warning |
| Programmatic base visible around image | Image has transparent padding | Increase `scale` so image covers the diamond area |

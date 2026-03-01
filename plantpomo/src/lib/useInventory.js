/**
 * useInventory — Local-first, optimistic inventory management.
 *
 * Performance architecture:
 *
 *  1. INSTANT FIRST PAINT
 *     On mount, inventory is loaded from localStorage immediately (synchronous,
 *     0 ms). The UI renders fully before any network request is made.
 *
 *  2. BACKGROUND HYDRATION
 *     Supabase fetch runs in the background. When it resolves it silently
 *     updates the map and writes the fresh data back to localStorage.
 *
 *  3. FULLY OPTIMISTIC MUTATIONS
 *     decrementInstance / restoreInstance update local state synchronously
 *     (the React state update happens before the function even returns).
 *     The Supabase call is fire-and-forget — it NEVER blocks the UI.
 *     localStorage is also updated synchronously so a page refresh shows the
 *     correct quantity even before the background write completes.
 *
 *  4. DEBOUNCED DB WRITES FOR INVENTORY
 *     Multiple rapid mutations (e.g. placing 5 tiles quickly) are collapsed
 *     into a single Supabase upsert after a 1-second quiet period, reducing
 *     API call count from N → 1.
 *
 * Exported shape:
 *   inventory        Map<itemId, { item_type, quantity }>
 *   ownedPlantIds    Set<string>
 *   ownedLandIds     Set<string>
 *   readyPlantIds    Set<string>  — quantity >= 1
 *   getQuantity(id)  → number
 *   decrementInstance(item_type, item_id)
 *   restoreInstance(item_type, item_id)
 *   buyItem(item_type, item_id, cost)  → Promise<{ok, error?}>
 *   loading          boolean  (true only on very first network fetch)
 *   refetch          () => void
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { DEFAULT_OWNED_PLANTS, DEFAULT_OWNED_LANDS } from "../components/tilesData";

const DEFAULT_QTY = 5;
const DEBOUNCE_MS = 1200;   // collapse rapid mutations into 1 DB write
const LS_KEY_PREFIX = "plantpomo:inventory:v1:";

// ── Serialisation helpers (Map ↔ plain array for localStorage) ───────────────
function mapToArray(m) {
    return [...m.entries()].map(([item_id, v]) => ({ item_id, ...v }));
}
function arrayToMap(arr) {
    const m = new Map();
    for (const row of arr) m.set(row.item_id, { item_type: row.item_type, quantity: row.quantity });
    return m;
}

function buildDefaultInventory() {
    const m = new Map();
    DEFAULT_OWNED_PLANTS.forEach(id => m.set(id, { item_type: "plant", quantity: DEFAULT_QTY }));
    DEFAULT_OWNED_LANDS.forEach(id => m.set(id, { item_type: "land", quantity: DEFAULT_QTY }));
    return m;
}

function readCache(userId) {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(LS_KEY_PREFIX + userId);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return arrayToMap(parsed);
    } catch {
        return null;
    }
}
function writeCache(userId, m) {
    if (!userId) return;
    try { localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify(mapToArray(m))); }
    catch { }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useInventory(profile, refetchProfile) {
    // ① Seed from localStorage (synchronous) so the UI is ready before any fetch
    const [inventory, setInventory] = useState(() => {
        const cached = readCache(profile?.id);
        return cached ?? buildDefaultInventory();
    });
    const [loading, setLoading] = useState(!readCache(profile?.id));  // skip spinner if cache hit

    // Stable refs
    const invRef = useRef(inventory);
    const debounceRef = useRef(null);    // timer for coalesced DB writes
    const pendingRef = useRef(new Map()); // item_id → latest quantity to write

    useEffect(() => { invRef.current = inventory; }, [inventory]);

    // ── Derived sets (recomputed each render, cheap) ──────────────────────────
    const ownedPlantIds = new Set(
        [...inventory.entries()].filter(([, v]) => v.item_type === "plant" && v.quantity > 0).map(([k]) => k)
    );
    const ownedLandIds = new Set(
        [...inventory.entries()].filter(([, v]) => v.item_type === "land" && v.quantity > 0).map(([k]) => k)
    );
    const readyPlantIds = new Set(
        [...inventory.entries()].filter(([, v]) => v.item_type === "plant" && v.quantity >= 1).map(([k]) => k)
    );

    const getQuantity = useCallback((id) => invRef.current.get(id)?.quantity ?? 0, []);

    // ── Core mutator (updates React state + localStorage synchronously) ────────
    const mutate = useCallback((id, delta, item_type = "plant") => {
        setInventory(prev => {
            const cur = prev.get(id) ?? { item_type, quantity: 0 };
            const newQty = Math.max(0, cur.quantity + delta);
            const next = new Map(prev);
            next.set(id, { ...cur, quantity: newQty });
            // ⚠️ Sync the ref immediately — this is what prevents the rapid-click exploit.
            // Without this, rapid clicks read stale invRef.current and bypass the qty < 1 guard.
            invRef.current = next;
            // Write to localStorage immediately so a refresh shows the right value
            writeCache(profile?.id, next);
            return next;
        });
    }, [profile?.id]);

    // ── Debounced bulk DB write ───────────────────────────────────────────────
    // Instead of one Supabase call per tile placement, we collect all changes in
    // pendingRef and flush them together after DEBOUNCE_MS of inactivity.
    const scheduleDatabaseFlush = useCallback((item_id, item_type) => {
        if (!supabase || !profile?.id) return;

        // Record the latest known quantity for this item
        pendingRef.current.set(item_id, item_type);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const snapshot = invRef.current;
            const batch = [...pendingRef.current.entries()];
            pendingRef.current.clear();

            // Build upsert rows from the latest local state
            const rows = batch.map(([iid, itype]) => ({
                user_id: profile.id,
                item_type: itype,
                item_id: iid,
                quantity: snapshot.get(iid)?.quantity ?? 0,
            }));

            supabase
                .from("user_inventory")
                .upsert(rows, { onConflict: "user_id,item_id" })
                .then(({ error }) => {
                    if (error) console.warn("[useInventory] flush failed:", error.message);
                });
        }, DEBOUNCE_MS);
    }, [profile?.id]);

    // ── Fetch from Supabase (runs once in the background) ────────────────────
    const fetchInventory = useCallback(async () => {
        if (!supabase || !profile?.id) { setLoading(false); return; }

        const { data, error } = await supabase
            .from("user_inventory")
            .select("item_type, item_id, quantity")
            .eq("user_id", profile.id);

        if (error) {
            console.warn("[useInventory] fetch error:", error.message);
            setLoading(false);
            return;
        }

        // Merge DB data on top of defaults
        const m = buildDefaultInventory();
        for (const row of (data ?? [])) {
            const existing = m.get(row.item_id);
            if (existing) {
                // Default-owned item — use the HIGHER of (default qty, DB qty)
                // so focus-session growth is never hidden
                m.set(row.item_id, { ...existing, quantity: Math.max(existing.quantity, row.quantity ?? 0) });
            } else {
                m.set(row.item_id, { item_type: row.item_type, quantity: row.quantity ?? 1 });
            }
        }

        setInventory(m);
        writeCache(profile.id, m);   // refresh the cache with authoritative data
        setLoading(false);
    }, [profile?.id]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // ── Re-seed from cache when user changes ─────────────────────────────────
    useEffect(() => {
        const cached = readCache(profile?.id);
        if (cached) { setInventory(cached); setLoading(false); }
        else { setInventory(buildDefaultInventory()); setLoading(true); }
    }, [profile?.id]);

    // ── decrementInstance ─────────────────────────────────────────────────────
    const decrementInstance = useCallback((item_type, item_id) => {
        // Re-read the ref right now (not from closure) — prevents rapid-click exploit
        const cur = invRef.current.get(item_id);
        if (!cur || cur.quantity < 1) return false;
        mutate(item_id, -1, item_type);
        scheduleDatabaseFlush(item_id, item_type);
        return true;
    }, [mutate, scheduleDatabaseFlush]);

    // ── restoreInstance ───────────────────────────────────────────────────────
    const restoreInstance = useCallback((item_type, item_id) => {
        mutate(item_id, +1, item_type);
        scheduleDatabaseFlush(item_id, item_type);
    }, [mutate, scheduleDatabaseFlush]);

    // ── buyItem ───────────────────────────────────────────────────────────────
    const buyItem = useCallback(async (item_type, item_id, cost) => {
        if (!supabase) return { ok: false, error: "Supabase not configured" };
        const { data, error } = await supabase.rpc("purchase_item", {
            p_item_type: item_type,
            p_item_id: item_id,
            p_cost: cost,
        });
        if (error) return { ok: false, error: error.message };
        mutate(item_id, +1, item_type);
        refetchProfile?.();
        return { ok: true, data };
    }, [mutate, refetchProfile]);

    return {
        inventory,
        ownedPlantIds,
        ownedLandIds,
        readyPlantIds,
        getQuantity,
        decrementInstance,
        restoreInstance,
        buyItem,
        loading,
        refetch: fetchInventory,
    };
}

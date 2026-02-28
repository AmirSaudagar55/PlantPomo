/**
 * useInventory — Fast, optimistic inventory management.
 *
 * Architecture:
 *  - All mutations update local state IMMEDIATELY (0 ms latency for the user).
 *  - Supabase calls fire in the background (fire-and-forget).
 *  - On fetch failure the state stays in place; a console warning is emitted.
 *
 * Exported shape:
 *   inventory        Map<itemId, { item_type, quantity }>
 *   ownedPlantIds    Set<string>  — plants with quantity > 0
 *   ownedLandIds     Set<string>  — lands  with quantity > 0
 *   readyPlantIds    Set<string>  — plants with quantity >= 1 (ready to place)
 *   getQuantity(id)  → number
 *   decrementInstance(type, id)   — synchronous optimistic -1, async DB sync
 *   restoreInstance(type, id)     — synchronous optimistic +1, async DB sync
 *   buyItem(type, id, cost)       → Promise<{ok, error?}>
 *   loading          boolean
 *   refetch          () => void
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { DEFAULT_OWNED_PLANTS, DEFAULT_OWNED_LANDS } from "../components/tilesData";

// Default quantity given to every free/default-owned item.
const DEFAULT_QTY = 5;

function buildDefaultInventory() {
    const m = new Map();
    DEFAULT_OWNED_PLANTS.forEach(id => m.set(id, { item_type: "plant", quantity: DEFAULT_QTY }));
    DEFAULT_OWNED_LANDS.forEach(id => m.set(id, { item_type: "land", quantity: DEFAULT_QTY }));
    return m;
}

export function useInventory(profile, refetchProfile) {
    const [inventory, setInventory] = useState(buildDefaultInventory);
    const [loading, setLoading] = useState(true);

    // Stable ref so fire-and-forget closures see latest state
    const invRef = useRef(inventory);
    useEffect(() => { invRef.current = inventory; }, [inventory]);

    // ── Derived sets ───────────────────────────────────────────────────────────
    // These are re-computed on every inventory change — they are plain values,
    // not hooks — so callers need to consume them from this hook's return value.
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

    // ── Helper: immutably update one item's quantity ───────────────────────────
    const mutate = useCallback((id, delta) => {
        setInventory(prev => {
            const cur = prev.get(id) ?? { item_type: "plant", quantity: 0 };
            const next = new Map(prev);
            next.set(id, { ...cur, quantity: Math.max(0, cur.quantity + delta) });
            return next;
        });
    }, []);

    // ── Fetch from Supabase ────────────────────────────────────────────────────
    const fetchInventory = useCallback(async () => {
        if (!supabase || !profile?.id) { setLoading(false); return; }

        const { data, error } = await supabase
            .from("user_inventory")
            .select("item_type, item_id, quantity")
            .eq("user_id", profile.id);

        if (error) { console.warn("[useInventory] fetch error:", error.message); setLoading(false); return; }

        const m = buildDefaultInventory();           // start from defaults
        for (const row of (data ?? [])) {
            const existing = m.get(row.item_id);
            if (existing) {
                // Merge: default items just get the DB quantity merged in (or accumulated)
                m.set(row.item_id, { ...existing, quantity: (existing.quantity || 0) + (row.quantity ?? 1) });
            } else {
                m.set(row.item_id, { item_type: row.item_type, quantity: row.quantity ?? 1 });
            }
        }
        setInventory(m);
        setLoading(false);
    }, [profile?.id]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // ── decrementInstance ─────────────────────────────────────────────────────
    // Synchronously adjusts local state; fires DB update in the background.
    const decrementInstance = useCallback((item_type, item_id) => {
        const cur = invRef.current.get(item_id);
        if (!cur || cur.quantity < 1) return;

        // Optimistic update — instant, no await
        mutate(item_id, -1);

        // Background sync (fire-and-forget)
        if (supabase && profile?.id) {
            supabase
                .from("user_inventory")
                .update({ quantity: Math.max(0, (cur.quantity - 1)) })
                .eq("user_id", profile.id)
                .eq("item_id", item_id)
                .then(({ error }) => {
                    if (error) console.warn("[useInventory] decrement sync failed:", error.message);
                });
        }
    }, [mutate, profile?.id]);

    // ── restoreInstance ───────────────────────────────────────────────────────
    const restoreInstance = useCallback((item_type, item_id) => {
        const cur = invRef.current.get(item_id) ?? { item_type, quantity: 0 };

        // Optimistic update — instant
        mutate(item_id, +1);

        // Background sync
        if (supabase && profile?.id) {
            supabase
                .from("user_inventory")
                .upsert({
                    user_id: profile.id,
                    item_type,
                    item_id,
                    quantity: cur.quantity + 1,
                }, { onConflict: "user_id,item_id" })
                .then(({ error }) => {
                    if (error) console.warn("[useInventory] restore sync failed:", error.message);
                });
        }
    }, [mutate, profile?.id]);

    // ── buyItem ───────────────────────────────────────────────────────────────
    const buyItem = useCallback(async (item_type, item_id, cost) => {
        if (!supabase) return { ok: false, error: "Supabase not configured" };
        const { data, error } = await supabase.rpc("purchase_item", {
            p_item_type: item_type,
            p_item_id: item_id,
            p_cost: cost,
        });
        if (error) return { ok: false, error: error.message };

        mutate(item_id, +1);   // grant 1 instance immediately
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

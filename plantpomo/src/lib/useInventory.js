import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { DEFAULT_OWNED_PLANTS, DEFAULT_OWNED_LANDS } from "../components/tilesData";

/**
 * Manages user inventory (owned plants/lands) from Supabase.
 * Falls back to the DEFAULT_OWNED lists when Supabase is unavailable.
 *
 * Returns:
 *   ownedPlantIds  – Set<string>
 *   ownedLandIds   – Set<string>
 *   buyItem(item_type, item_id, cost) → Promise<{ ok, error }>
 *   loading
 */
export function useInventory(profile, refetchProfile) {
    const [ownedPlantIds, setOwnedPlantIds] = useState(new Set(DEFAULT_OWNED_PLANTS));
    const [ownedLandIds, setOwnedLandIds] = useState(new Set(DEFAULT_OWNED_LANDS));
    const [loading, setLoading] = useState(true);

    const fetchInventory = useCallback(async () => {
        if (!supabase || !profile?.id) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from("user_inventory")
            .select("item_type, item_id")
            .eq("user_id", profile.id);

        if (!error && data) {
            const plants = new Set([
                ...DEFAULT_OWNED_PLANTS,
                ...data.filter((r) => r.item_type === "plant").map((r) => r.item_id),
            ]);
            const lands = new Set([
                ...DEFAULT_OWNED_LANDS,
                ...data.filter((r) => r.item_type === "land").map((r) => r.item_id),
            ]);
            setOwnedPlantIds(plants);
            setOwnedLandIds(lands);
        }
        setLoading(false);
    }, [profile?.id]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    const buyItem = useCallback(async (item_type, item_id, cost) => {
        if (!supabase) return { ok: false, error: "Supabase not configured" };
        const { data, error } = await supabase.rpc("purchase_item", {
            p_item_type: item_type,
            p_item_id: item_id,
            p_cost: cost,
        });
        if (error) return { ok: false, error: error.message };

        // Optimistically update local state
        if (item_type === "plant") setOwnedPlantIds((prev) => new Set([...prev, item_id]));
        else setOwnedLandIds((prev) => new Set([...prev, item_id]));

        refetchProfile?.(); // refresh droplet count in profile
        return { ok: true, data };
    }, [refetchProfile]);

    return { ownedPlantIds, ownedLandIds, buyItem, loading, refetch: fetchInventory };
}

/**
 * useLeaderboard — Zero-cost, truly real-time weekly leaderboard.
 *
 * Cost architecture:
 *  1. SINGLE FETCH per browser session, per week.
 *     Results are cached in sessionStorage keyed { "lb:week:<YYYY-MM-DD>" }.
 *     Re-opening the panel zero-costs; data comes from cache.
 *
 *  2. REALTIME — ZERO extra queries after initial fetch.
 *     Supabase sends the full updated `profiles` row on every UPDATE.
 *     We merge it into local state without hitting the DB again.
 *     This makes the leaderboard animate in-place whenever *any* user
 *     completes a focus session.
 *
 *  3. WEEK BOUNDARY DETECTION.
 *     On each realtime event we check if the new row's `weekly_focus_week`
 *     matches our cached week. If a new week has started, we invalidate
 *     the cache and do one fresh fetch.
 *
 * Exported shape:
 *   entries   — sorted array of profile rows for the current week (max 50)
 *   loading   — true only during the first network request
 *   myRank    — 1-based rank of the current user (or null if not in top 50)
 *   currentWeekStart — ISO date string of the week being displayed
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { localWeekStart } from "./useUserLocation";

const LIMIT = 50;
const CACHE_PREFIX = "plantpomo:lb:week:";
const CHANNEL_NAME = "leaderboard_profiles";

// Cached IANA timezone — written by useUserLocation on first login
function getStoredTz() {
    try { return localStorage.getItem("plantpomo:timezone") || "UTC"; } catch { return "UTC"; }
}

// Current local week-start "YYYY-MM-DD" — uses the user's actual timezone
function thisWeekStart() {
    return localWeekStart(getStoredTz());
}

function cacheKey(week) { return CACHE_PREFIX + week; }

function readCache(week) {
    try {
        const raw = sessionStorage.getItem(cacheKey(week));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function writeCache(week, entries) {
    try { sessionStorage.setItem(cacheKey(week), JSON.stringify(entries)); } catch { }
}

// Merge an updated profile row into the sorted entries array
// (handles inserts, updates, and — rarely — rank changes)
function mergeEntry(entries, updatedRow, week) {
    // If the updated row belongs to a *different* week, ignore it
    if (updatedRow.weekly_focus_week !== week) return entries;

    const idx = entries.findIndex(e => e.id === updatedRow.id);
    let next;

    if (idx !== -1) {
        // Update existing slot
        next = entries.map((e, i) => i === idx ? { ...e, ...updatedRow } : e);
    } else {
        // Candidate for entering the top-N
        const last = entries[entries.length - 1];
        if (entries.length < LIMIT || !last || updatedRow.weekly_focus_minutes > last.weekly_focus_minutes) {
            next = [...entries, updatedRow];
            if (next.length > LIMIT) next = next.slice(0, LIMIT); // trimmed after sort
        } else {
            return entries; // not in top-N
        }
    }

    // Re-sort by weekly_focus_minutes desc
    next.sort((a, b) => (b.weekly_focus_minutes ?? 0) - (a.weekly_focus_minutes ?? 0));
    return next.slice(0, LIMIT);
}

export function useLeaderboard(currentUserId) {
    const week = thisWeekStart();

    const [entries, setEntries] = useState(() => readCache(week) ?? []);
    const [loading, setLoading] = useState(!readCache(week));

    const channelRef = useRef(null);
    const weekRef = useRef(week);   // keep ref to detect week changes in realtime callback

    // ── Initial fetch (only if cache miss) ─────────────────────────────────
    const fetchLeaderboard = useCallback(async (force = false) => {
        if (!supabase) { setLoading(false); return; }
        const w = thisWeekStart();
        if (!force && readCache(w)) { setEntries(readCache(w)); setLoading(false); return; }

        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, current_streak, weekly_focus_minutes, weekly_focus_week, is_premium, droplets")
            .eq("weekly_focus_week", w)
            .order("weekly_focus_minutes", { ascending: false })
            .limit(LIMIT);

        if (error) { console.warn("[useLeaderboard] fetch error:", error.message); setLoading(false); return; }

        const rows = data ?? [];
        weekRef.current = w;
        setEntries(rows);
        writeCache(w, rows);
        setLoading(false);
    }, []);

    // ── Supabase Realtime subscription ─────────────────────────────────────
    useEffect(() => {
        if (!supabase) return;

        fetchLeaderboard();

        // Subscribe to ALL profile updates — filter by week in JS to stay free
        channelRef.current = supabase
            .channel(CHANNEL_NAME)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "profiles" },
                (payload) => {
                    const updated = payload.new;
                    const currentWeek = thisWeekStart();

                    // Week has flipped (e.g., it just turned Monday) — full refetch
                    if (weekRef.current !== currentWeek) {
                        weekRef.current = currentWeek;
                        setEntries([]);
                        fetchLeaderboard(true);
                        return;
                    }

                    setEntries(prev => {
                        const next = mergeEntry(prev, updated, currentWeek);
                        writeCache(currentWeek, next);   // keep cache warm
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [fetchLeaderboard]);

    // ── Derived: current user's rank ────────────────────────────────────────
    const myRank = currentUserId
        ? entries.findIndex(e => e.id === currentUserId) + 1 || null
        : null;

    return { entries, loading, myRank, currentWeekStart: week, refetch: () => fetchLeaderboard(true) };
}

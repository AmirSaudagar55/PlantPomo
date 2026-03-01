/**
 * useUserLocation
 *
 * Detects the user's IANA timezone (via Intl — zero network cost) and
 * country code (via a single lightweight IP-lookup on first visit only,
 * then cached in localStorage forever).
 *
 * Both values are silently synced to the user's `profiles` row in Supabase
 * so the backend and leaderboard can use accurate local boundaries.
 *
 * Exported:
 *   timezone     — IANA string, e.g. "Asia/Kolkata"
 *   countryCode  — ISO-3166-1 alpha-2, e.g. "IN"  (null while loading)
 *   weekStart    — ISO date "YYYY-MM-DD" of Monday of the current local week
 *   localDate    — ISO date "YYYY-MM-DD" of today in the user's timezone
 */

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const LS_COUNTRY = "plantpomo:country_code";
const LS_TZ = "plantpomo:timezone";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** IANA timezone from the browser — always available, zero network cost. */
function detectTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

/**
 * Returns "YYYY-MM-DD" for *today* in the given IANA timezone.
 * Uses Intl so no extra library is needed.
 */
export function localDateString(tz = "UTC") {
    return new Date().toLocaleDateString("en-CA", { timeZone: tz }); // en-CA gives YYYY-MM-DD
}

/**
 * Returns "YYYY-MM-DD" of the Monday that starts the current week,
 * evaluated in the given IANA timezone.
 */
export function localWeekStart(tz = "UTC") {
    const today = new Date(localDateString(tz) + "T00:00:00");
    const day = today.getDay();              // 0 = Sun
    const diff = day === 0 ? -6 : 1 - day;   // shift to Monday
    today.setDate(today.getDate() + diff);
    return today.toISOString().slice(0, 10);
}

/** Fetch country code via ipapi.co (free, ~1 req/visit, cached in localStorage). */
async function fetchCountryCode() {
    const cached = localStorage.getItem(LS_COUNTRY);
    if (cached) return cached;

    try {
        // ipapi.co/json returns a small JSON with `country_code` field.
        // 1000 free requests/day — plenty for first-visit detection.
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error("non-200");
        const data = await res.json();
        const code = data?.country_code ?? null;
        if (code) localStorage.setItem(LS_COUNTRY, code);
        return code;
    } catch {
        return null; // fail silently — pricing falls back to USD
    }
}

/* ── Main hook ────────────────────────────────────────────────────────────── */
export function useUserLocation(userId) {
    const [timezone, setTimezone] = useState(() => localStorage.getItem(LS_TZ) || detectTimezone());
    const [countryCode, setCountryCode] = useState(() => localStorage.getItem(LS_COUNTRY));

    useEffect(() => {
        if (!userId || !supabase) return;

        const tz = detectTimezone();
        setTimezone(tz);
        localStorage.setItem(LS_TZ, tz);

        let cancelled = false;

        (async () => {
            const cc = await fetchCountryCode();
            if (cancelled) return;
            if (cc) setCountryCode(cc);

            // Silently sync to profiles — only if values differ from what's stored
            const { data: profile } = await supabase
                .from("profiles")
                .select("timezone, country_code")
                .eq("id", userId)
                .single();

            if (cancelled) return;

            const needsUpdate =
                profile?.timezone !== tz ||
                (cc && profile?.country_code !== cc);

            if (needsUpdate) {
                await supabase
                    .from("profiles")
                    .update({
                        timezone: tz,
                        ...(cc ? { country_code: cc } : {}),
                    })
                    .eq("id", userId);
            }
        })();

        return () => { cancelled = true; };
    }, [userId]);

    return {
        timezone,
        countryCode,
        localDate: localDateString(timezone),
        weekStart: localWeekStart(timezone),
    };
}

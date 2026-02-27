import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * Provides the current user's profile from `public.profiles`.
 * Returns { profile, loading, error, refetch }.
 *
 * Uses .maybeSingle() (not .single()) to avoid the 406 "no rows" error.
 * After sign-in the handle_new_user trigger runs async, so if the first
 * fetch returns null we retry up to 3 times with 500 ms backoff.
 */
export function useProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const retryCount = useRef(0);

    const fetchProfile = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error: err } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(); // 200 with null when no row, never 406

        if (err) {
            setError(err);
            setLoading(false);
            return;
        }

        if (!data && retryCount.current < 3) {
            // Profile row not yet created by the DB trigger — retry shortly
            retryCount.current += 1;
            setTimeout(fetchProfile, 600);
            return;
        }

        retryCount.current = 0;
        setProfile(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProfile();

        if (!supabase) return;

        // Re-fetch whenever auth state changes (sign-in / sign-out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                retryCount.current = 0;
                setLoading(true);
                fetchProfile();
            }
            if (event === "SIGNED_OUT") {
                setProfile(null);
                setLoading(false);
            }
        });

        // Real-time profile updates (droplets, streak, etc.)
        const channel = supabase
            .channel("profile_changes")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "profiles" },
                (payload) => {
                    setProfile((prev) =>
                        prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev
                    );
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile };
}

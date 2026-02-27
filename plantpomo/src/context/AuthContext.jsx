import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    console.log("[Auth] Initializing AuthContext...");
    console.log("[Auth] hasSupabaseConfig:", hasSupabaseConfig);

    if (!hasSupabaseConfig || !supabase) {
      console.warn("[Auth] Supabase configuration is missing or client is null.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("[Auth] Error fetching initial session:", error);
          setAuthError(error.message || "Failed to load session");
        } else {
          console.log("[Auth] Initial session loaded:", data.session);
          setSession(data.session ?? null);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("[Auth] Exception during getSession():", error);
        setAuthError(error?.message || "Failed to load session");
        setLoading(false);
      });

    console.log("[Auth] Subscribing to auth state changes...");
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log(`[Auth] Auth state changed! Event: ${event}`, { session: nextSession });
      if (!isMounted) return;
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider) => {
    console.log(`[Auth] Attempting to sign in with provider: ${provider}...`);
    if (!hasSupabaseConfig || !supabase) {
      console.error("[Auth] Cannot sign in, Supabase config is missing.");
      setAuthError("Missing Supabase env config");
      return;
    }

    setAuthError("");
    console.log(`[Auth] Initiating OAuth redirect to: ${window.location.origin}`);

    const { error, data } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // With implicit flow Supabase returns the token in the URL hash to this
        // callback route; supabase-js picks it up automatically via detectSessionInUrl.
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("[Auth] OAuth sign-in returned an error:", error);
      setAuthError(error.message || "OAuth sign-in failed");
    } else {
      console.log("[Auth] OAuth sign-in prompt launched successfully.", data);
    }
  };

  const signOut = async () => {
    console.log("[Auth] Attempting to sign out...");
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Auth] Sign-out failed:", error);
      setAuthError(error.message || "Sign out failed");
    } else {
      console.log("[Auth] Successfully signed out.");
    }
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      authError,
      hasSupabaseConfig,
      signInWithProvider,
      signOut,
    }),
    [session, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};


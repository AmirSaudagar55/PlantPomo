import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * AuthCallback — handles the Supabase OAuth redirect.
 *
 * With implicit flow, Supabase sends the user back to /auth/callback with
 * the access token in the URL hash:
 *   /auth/callback#access_token=...&refresh_token=...&type=bearer
 *
 * `detectSessionInUrl: true` in supabaseClient means supabase-js will pick
 * this up automatically and fire SIGNED_IN on the auth state listener.
 * All we need to do here is WAIT for that event, then navigate home.
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supabase) {
            setError("Supabase is not configured.");
            return;
        }

        // supabase-js fires SIGNED_IN automatically when it detects the hash token.
        // We just listen for it and redirect.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                console.log("[AuthCallback] SIGNED_IN detected, redirecting home…");
                subscription.unsubscribe();
                navigate("/", { replace: true });
            } else if (event === "INITIAL_SESSION" && !session) {
                // No session after loading — the auth code may have expired or been invalid
                console.warn("[AuthCallback] No session on INITIAL_SESSION, navigating home.");
                subscription.unsubscribe();
                navigate("/", { replace: true });
            }
        });

        // Safety net: if nothing fires within 5 seconds, go home anyway
        const timeout = setTimeout(() => {
            console.warn("[AuthCallback] Timeout waiting for session, navigating home.");
            subscription.unsubscribe();
            navigate("/", { replace: true });
        }, 5000);

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [navigate]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#05060a",
                gap: "16px",
            }}
        >
            {error ? (
                <>
                    <div style={{ fontSize: 40 }}>❌</div>
                    <p style={{ color: "#ff6b6b", fontSize: 16, textAlign: "center", maxWidth: 360 }}>
                        Authentication failed: {error}
                    </p>
                    <button
                        onClick={() => navigate("/", { replace: true })}
                        style={{
                            padding: "8px 20px",
                            borderRadius: 8,
                            background: "rgba(57,255,20,0.08)",
                            border: "1px solid rgba(57,255,20,0.2)",
                            color: "#39ff14",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Go back home
                    </button>
                </>
            ) : (
                <>
                    {/* Spinner */}
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            border: "3px solid rgba(57,255,20,0.15)",
                            borderTop: "3px solid #39ff14",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: "rgba(230,255,230,0.7)", fontSize: 14 }}>
                        Signing you in… 🌿
                    </p>
                </>
            )}
        </div>
    );
};

export default AuthCallback;

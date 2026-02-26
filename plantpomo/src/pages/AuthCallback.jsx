import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * AuthCallback — handles the Supabase OAuth redirect.
 *
 * Supabase sends the user back to /auth/callback with either:
 *   • PKCE flow: ?code=...&state=...  → we call exchangeCodeForSession()
 *   • Implicit flow: #access_token=... → supabase-js detects this automatically
 *
 * After the session is set the user is redirected to the home page.
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!supabase) {
            setError("Supabase is not configured.");
            return;
        }

        // Parse the URL for a PKCE 'code' param
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
            // PKCE flow — exchange the auth code for a real session
            supabase.auth
                .exchangeCodeForSession(code)
                .then(({ error: exchangeError }) => {
                    if (exchangeError) {
                        console.error("[AuthCallback] Code exchange failed:", exchangeError);
                        setError(exchangeError.message);
                    } else {
                        console.log("[AuthCallback] Session established via PKCE, redirecting home…");
                        navigate("/", { replace: true });
                    }
                });
        } else {
            // Implicit / hash flow — supabase-js handles this via onAuthStateChange
            // Just wait a moment and navigate home; the AuthContext will pick up the session
            const tid = setTimeout(() => navigate("/", { replace: true }), 1200);
            return () => clearTimeout(tid);
        }
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

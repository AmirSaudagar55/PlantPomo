import React from "react";
import {
  BarChart3,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Droplets,
  Store,
  Flame,
  LogOut,
} from "lucide-react";
import ShowHideVideoToggle from "./ShowHideVideoToggle";
import MusicMenu from "./MusicMenu";
import { useAuth } from "../context/AuthContext";

/* ─────────────────────────────────────────────
   Google "G" SVG Mark (official colour version)
───────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.22l6.85-6.85C35.83 2.38 30.28 0 24 0 14.61 0 6.62 5.56 2.96 13.65l7.98 6.2C12.62 13.47 17.87 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.65c-.54 2.9-2.2 5.36-4.68 7.01l7.35 5.71C43.53 38 46.5 31.78 46.5 24.5z" />
    <path fill="#FBBC05" d="M10.94 28.14A14.56 14.56 0 0 1 9.5 24c0-1.44.25-2.84.66-4.14l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.92.94 7.62 2.6 10.89l8.34-6.75z" />
    <path fill="#34A853" d="M24 48c6.28 0 11.56-2.08 15.41-5.65l-7.35-5.71C29.94 38.31 27.15 39.5 24 39.5c-6.13 0-11.38-3.97-13.06-9.36l-8.34 6.75C6.62 44.44 14.61 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
const Navbar = ({
  theme = "dark",
  toggleTheme = () => { },
  isMuted = false,
  toggleMute = () => { },
  onOpenYouTubePopup = () => { },
}) => {
  const {
    user,
    loading,
    authError,
    hasSupabaseConfig,
    signInWithProvider,
    signOut,
  } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url;
  const userInitial =
    (user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase();

  return (
    <nav className="relative flex items-center justify-between px-5 py-3 gap-3 z-20">

      {/* ── LEFT: Logo / Brand ── */}
      <div className="flex items-center gap-2 select-none shrink-0">
        <span className="text-xl font-black tracking-tight neon-text">🌿 PlantPomo</span>
      </div>

      {/* ── CENTER: Droplets · Store · Streak ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Droplets (in-game currency) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-900/30 border border-sky-500/20 text-sky-400 text-sm font-semibold select-none">
          <Droplets size={15} className="shrink-0" />
          <span>250</span>
        </div>

        {/* Store */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("shop:open"))}
          title="Open Shop"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-800/30 transition-colors"
        >
          <Store size={14} />
          <span>Store</span>
        </button>

        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-900/30 border border-orange-500/20 text-orange-400 text-sm font-semibold select-none">
          <Flame size={14} className="shrink-0" />
          <span>0</span>
          <span className="text-orange-400/60 font-normal text-xs">day streak</span>
        </div>
      </div>

      {/* ── RIGHT: Controls + Auth ── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Analytics */}
        <button
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
          aria-label="Analytics"
          title="Analytics"
        >
          <BarChart3 size={16} className="text-muted-foreground" />
        </button>

        {/* Music menu — YouTube popup opened via prop */}
        <MusicMenu onOpenYouTubePopup={onOpenYouTubePopup} />

        {/* Show / Hide video toggle */}
        <ShowHideVideoToggle />

        {/* Mute / Unmute */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute background video" : "Mute background video"}
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX size={16} className="text-muted-foreground" />
          ) : (
            <Volume2 size={16} className="text-emerald-400" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
        >
          {theme === "dark" ? (
            <Sun size={16} style={{ color: "var(--neon)" }} />
          ) : (
            <Moon size={16} className="text-muted-foreground" />
          )}
        </button>

        {/* ── Auth section ── */}
        {authError && (
          <span className="text-xs text-red-300/90 bg-red-500/10 border border-red-400/30 px-2 py-1 rounded-md">
            {authError}
          </span>
        )}

        {/* Signed-out: show Google sign-in button */}
        {hasSupabaseConfig && !user && (
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors text-xs font-semibold text-white/90"
            onClick={() => signInWithProvider("google")}
            disabled={loading}
          >
            <GoogleIcon />
            Sign in
          </button>
        )}

        {/* No Supabase config: show a placeholder sign in */}
        {!hasSupabaseConfig && !user && (
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors text-xs font-semibold text-white/90"
            title="Supabase not configured"
            disabled
          >
            <GoogleIcon />
            Sign in
          </button>
        )}

        {/* Signed-in: profile avatar */}
        {user && (
          <div className="relative group">
            <button
              className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-emerald-400/50 transition-colors focus:outline-none"
              title={user?.user_metadata?.full_name || user?.email}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-500 text-black text-xs font-bold">
                  {userInitial}
                </div>
              )}
            </button>

            {/* Dropdown on hover */}
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-[hsl(220,20%,8%)]/90 backdrop-blur-xl shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top-right z-50 pointer-events-none group-hover:pointer-events-auto">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-xs text-white/90 font-semibold truncate">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors rounded-b-xl"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

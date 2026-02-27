import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY2;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Implicit flow: the access token arrives in the URL hash and is
      // handled entirely by supabase-js in the browser — no server needed.
      // PKCE requires SSR (Next.js/SvelteKit) to store the code verifier in
      // cookies across the redirect; it will always fail in a Vite SPA.
      flowType: "implicit",
    },
  })
  : null;

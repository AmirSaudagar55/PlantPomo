# PlantPomo Frontend

React + Vite frontend for PlantPomo timer UI with Supabase OAuth auth.

## Setup

1. Create env file:
   - Copy `.env.example` to `.env`
   - Fill values from your Supabase project

2. Install dependencies:
   - `npm install`

3. Run dev server:
   - `npm run dev`

## Supabase OAuth configuration

In Supabase dashboard:

1. Enable providers:
   - Authentication -> Providers -> enable `Google` and/or `GitHub`

2. Set redirect URLs:
   - Add your local app URL (for example `http://localhost:5173`) in allowed redirect URLs

3. Ensure env vars are set in frontend:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Auth behavior in app

- Navbar shows `Continue with Google` and `Continue with GitHub` when signed out
- After successful OAuth redirect, session is restored automatically
- Navbar shows user label and sign-out button when signed in


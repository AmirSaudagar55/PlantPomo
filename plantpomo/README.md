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

## Components Overview

Here's a brief breakdown of the key custom components implemented in this project:

- **`FocusCard.jsx`**
  The main central card that houses the timer logic. It controls the focus/break phases (Pomodoro), updates timer progress, displays the active plant, and controls user actions (Start, Pause, Complete, Settings Toggle).

- **`SessionComplete.jsx`**
  A highly optimized celebration overlay that appears when a focus session ends. It uses the Web Audio API to play an ascending success chime (zero assets loaded) and pure CSS keyframe animations for falling leaves and a glowing popup toast, meaning no JS per-frame updates when dismissing itself.

- **`MusicMenu.jsx`**
  A custom dropdown menu located in the Navbar for managing the background sounds. It includes a beautiful slider for volume control (which dispatches events correctly without ref-drilling), options to switch music tabs, and functionality to add external YouTube videos.

- **`VideoBackground.jsx`**
  Renders the user-provided YouTube URL as a fullscreen background. To keep audio playing independently of visual visibility, the iframe is never fully unmounted. Instead, changes in visibility smoothly fade the iframe's opacity to `0`, and the YouTube postMessage IFrame API is used to adjust volume directly inside the iframe.

- **`ShowHideVideoToggle.jsx`**
  The top-navigation toggle button that globally controls whether the background video is visually hidden or showing. Rather than propagating state tightly via props, it fires a global `video:visibilitychange` Event that components (like `Index.jsx`) listen to dynamically.


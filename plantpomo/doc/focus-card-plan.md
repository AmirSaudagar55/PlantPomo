# Focus Card Functionality Plan

This document outlines the architecture, features, and edge case handling for the new Focus Card experience, aiming to match top-tier productivity applications.

## 1. Core Modes

The Focus Card will support two primary modes, toggled by a "Mode Switch" button:

### A. Pomodoro Mode (Count Down)
- **Behavior**: Follows a strict work/break structure (Focus ➔ Short Break ➔ Long Break).
- **Display**: Shows time remaining, counting down to 00:00.
- **Progression**: 
  - Automatically or manually advances to the next phase when time is up.
  - Phase lengths are dictated by user Settings.

### B. Stopwatch Mode (Count Up)
- **Behavior**: An open-ended focus session.
- **Display**: Shows elapsed time, counting up from 00:00.
- **Progression**: Continues until the user explicitly pauses and hits "Complete".

## 2. Controls & Actions

- **Play / Pause**: 
  - Pauses the active timer/stopwatch without losing the accumulated time.
  - Resumes exactly from where it left off.
- **Complete (Stop) Button**:
  - *Pomodoro*: If clicked during Focus, it ends the session early, records the elapsed time (if valid), and skips to the Break.
  - *Stopwatch*: Stops the timer, records the total elapsed time, and resets for a new session.
- **Mode Toggle**: Switches between Pomodoro and Stopwatch.
- **Settings Button**: Adjusts Pomodoro durations.

## 3. Edge Cases & Robustness Strategy

To make the logic "perfect like other existing applications", we must handle the following technical and UX edge cases:

### Edge Case 1: Browser Background Throttling (The "Sleeping Tab" Problem)
- **Issue**: `setInterval` heavily throttles when a browser tab is inactive, causing timers to lose seconds/minutes.
- **Solution**: Do not rely on decrementing a counter every second. Instead:
  - When starting/resuming, record the absolute `targetEndTime` (Pomodoro) or `sessionStartTime` (Stopwatch).
  - Every interval tick, calculate the delta against `Date.now()`. This guarantees 100% accuracy even if the user leaves the tab for hours.

### Edge Case 2: Switching Modes Mid-Session
- **Issue**: Switching from Pomodoro to Stopwatch while a timer is running creates conflicting state.
- **Solution**: 
  - If a session is actively running or paused (with time elapsed > 0), disable the mode toggle OR show a confirmation dialog: "Switching modes will discard your current session. Continue?"
  - If time elapsed is 0, allow seamless toggling.

### Edge Case 3: Changing Settings Mid-Session
- **Issue**: User opens settings and changes Focus Time from 25 min to 50 min while currently at 10:00 remaining.
- **Solution**: 
  - Settings changes will only apply to the **next** phase. 
  - The current running countdown is unaffected to prevent immediate, jarring jumps in the display.

### Edge Case 4: Accidental Page Refresh
- **Issue**: User reloads the page and loses an active 45-minute focus session.
- **Solution (Optional but highly recommended)**: 
  - Persist timer state (mode, timestamps, phase) to `localStorage` on change.
  - On component mount, re-hydrate the state so the timer continues seamlessly.

### Edge Case 5: The "Too Short" Session
- **Issue**: User starts a stopwatch and hits Complete 3 seconds later.
- **Solution**: Implement a minimum threshold (e.g., 1 minute) to count as a "Completed Session" for plant growth, preventing spam.

## 4. State Management Refresh

We will refactor the state inside `FocusCard.jsx` to be more resilient:
- `timerRunState`: `'idle' | 'running' | 'paused'`
- `mode`: `'pomodoro' | 'stopwatch'`
- `startTimestamp`: `number | null` (Date.now() when Play is pressed)
- `accumulatedTime`: `number` (Time saved when Pause is pressed)
- `phase`: `'focus' | 'shortBreak' | 'longBreak'` (Only applies to Pomodoro)

By moving to timestamp-based calculation, Play/Pause and Complete logic will become rock-solid.

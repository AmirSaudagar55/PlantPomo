Activity Heatmap Feature
Design an aesthetically pleasing GitHub-style contribution graph to track daily focus intensity for the past year.

User Review Required
Please review the proposed design and color-mapping for the heatmap. Do you want to adjust the exact minute thresholds for the color intensities? By default, the plan maps them as: 0m | 1-30m | 31-60m | 61-120m | 120m+.

Proposed Changes
Components Layer
[NEW] src/components/ActivityHeatmap.jsx
Role: Renders a visually stunning focus contribution graph in a popover card.
Data Hook: Uses supabase to fetch focus_sessions for the logged-in user over the last 365 days.
Data Transformation:
Automatically generates an array of the last 365 dates (padded with empty days at the start to correctly align with Sunday-Saturday rows).
Groups sessions by day and sums the duration_seconds.
UI Spec:
Uses CSS Grid (grid-flow-col grid-rows-7 gap-1).
Maps duration limits to PlantPomo's neon aesthetic:
Lvl 0: 0 mins -> bg-white/5 border border-white/10
Lvl 1: 1-30 mins -> Soft green bg-emerald-900/50
Lvl 2: 31-60 mins -> Medium green bg-emerald-600/60
Lvl 3: 61-120 mins -> Bright green bg-emerald-400/80
Lvl 4: 120+ mins -> Neon bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.4)]
Includes a slick legend mapping intensity levels to durations (e.g., < 30m, 1hr+, 5hr+, 10hr+).
Uses tooltips on hover to show exact date and focus time.
The component will render absolute/fixed positioned in the bottom-left corner with a smooth enter/exit slide transition.
[MODIFY] 
src/pages/Index.jsx
Role: Top-level page layout.
Updates:
Modify the <footer ... justify-end> section to use justify-between.
Add a toggle button with the Lucide Grid or Activity icon on the left side of the footer.
Manage heatMapOpen state to mount <ActivityHeatmap> when triggered.
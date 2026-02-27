# PlantPomo Database Plan

This document outlines the Supabase database schema, store logic, and analytics approach for PlantPomo.

## 1. Database Schema

### Table: `profiles`
Extends the default `auth.users` with app-specific data.
- `id`: UUID (Primary Key, references `auth.users.id`)
- `full_name`: Text
- `avatar_url`: Text
- `droplets`: Integer (Default: 0) — The in-game currency used to buy plants/lands.
- `current_streak`: Integer (Default: 0) — Consecutive days of focusing.
- `longest_streak`: Integer (Default: 0)
- `last_focus_date`: Date — Used to calculate if the streak should be incremented or reset.
- `total_focus_minutes`: Integer (Default: 0) — Accumulated focus duration. Used globally for the **Leaderboard**.
- `created_at`: TimestampTZ

### Table: `focus_sessions`
Records every completed focus session.
- `id`: UUID (Primary Key, default `uuid_generate_v4()`)
- `user_id`: UUID (Foreign Key to `profiles.id`)
- `start_time`: TimestampTZ
- `end_time`: TimestampTZ
- `duration_seconds`: Integer
- `plant_id`: Text
- `land_id`: Text
- `created_at`: TimestampTZ

### Table: `user_inventory`
Tracks which items (plants and lands) the user has successfully purchased/unlocked from the store.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `profiles.id`)
- `item_type`: Text (e.g., `'plant'`, `'land'`)
- `item_id`: Text (e.g., `'palm'`, `'castle'`)
- `purchased_at`: TimestampTZ

### Table: `garden_instances`
Represents the actual grown plants placed in the user's garden. When a user focuses long enough to "build up" a plant, a new row is inserted here.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `profiles.id`)
- `plant_id`: Text
- `land_id`: Text
- `focus_session_id`: UUID (Foreign Key to `focus_sessions.id`)
- `created_at`: TimestampTZ

---

## 2. Updated Static Data (`tilesData.jsx`)

We need to add a `buildTime` property (in minutes) to determine how much focus time is required to completely grow 1 instance of a plant/land combination. We also need to strip hardcoded `owned: true/false` since ownership will be determined dynamically by the database row in `user_inventory` (or by a list of default "base" items).

Example modified item:
```javascript
{ 
  id: "palm", 
  name: "Tropical", 
  icon: <Palmtree size={28} />, 
  rarity: "rare", 
  cost: 50,         // Costs 50 droplets to unlock
  buildTime: 60     // Requires 60 minutes of focus to grow 1 instance
}
```

---

## 3. Store Logic

1. **Purchasing**:
   - User selects an unowned plant/land.
   - Frontend verifies `user.droplets >= item.cost`.
   - Call an RPC function or update `profiles` to deduct droplets and insert a row into `user_inventory`.
   - RPC function `purchase_item(item_type, item_id, cost)` should be used to securely handle the transaction atomically and prevent race conditions.

---

## 4. Growth Logic (Garden Instances)

When a Focus Session completes:
1. `focus_session` row is created.
2. `profiles.total_focus_minutes` is incremented.
3. `profiles.droplets` is incremented (e.g., 1 droplet per minute focused).
4. Streak is updated based on `last_focus_date`.
5. **Growth check**:
   - Retrieve `buildTime` for the selected `plant_id`.
   - If `duration_minutes >= buildTime`, calculate how many instances grew: `Math.floor(duration_minutes / buildTime)`.
   - Insert that many rows into `garden_instances`.

---

## 5. Analytics (Client-Side)

### Data Fetching
To satisfy Daily, Weekly, Monthly, Yearly analytics, we query the `focus_sessions` table for the current user.
- We can fetch recent sessions (e.g., `created_at >= last_30_days`) to render charts.
- The client-side code will perform the specific bucketing/aggregation (grouping by day, week, month) using simple JS array methods. This reduces reliance on complex SQL views and keeps the server lightweight.

### Leaderboard
A simple query on `profiles`:
```javascript
supabase.from('profiles')
  .select('id, full_name, avatar_url, total_focus_minutes')
  .order('total_focus_minutes', { ascending: false })
  .limit(50);
```

---

## 6. Security (Row Level Security - RLS)

- `profiles`: Users can READ all (needed for leaderboard), but UPDATE only their own.
- `focus_sessions`: Users can READ/INSERT only their own.
- `user_inventory`: Users can READ/INSERT only their own.
- `garden_instances`: Users can READ/INSERT only their own.


Supabase Database & Focus Integration
This plan implements the database schema required for storing user streaks, focus sessions, acquired plants/lands, and executing store transactions.

Proposed Changes
1. Supabase Migrations (Database Layer)
We will create SQL scripts to instantiate the following tables and functions via the Supabase Dashboard:

profiles Table & Trigger
Stores user stats (droplets, streak, total focus minutes).

Trigger: Automatically inserts a row into profiles whenever a new user signs up via auth.users.
focus_sessions Table
Records every completed timer session.

Columns: id, user_id, start_time, end_time, duration_seconds, plant_id, land_id.
user_inventory Table
Tracks what items (plants/lands) the user has explicitly purchased from the store.

garden_instances Table
Tracks actual grown instances of plants based on focus time.

E.g., Focusing for 60 mins on a plant with a 30-min build time yields 2 instances.
purchase_item RPC Function
A secure, atomic database function that checks if the user has enough droplets, deducts them, and inserts the item into user_inventory in one transaction.

2. Frontend Changes (src/)
[MODIFY] 
src/components/tilesData.jsx
What: Remove hardcoded owned: true/false. Add buildTime (in minutes) to dictate how long a plant takes to fully mature and yield 1 instance.
Example: carnation gets buildTime: 30, palm gets buildTime: 60.
[MODIFY] 
src/components/FocusCard.jsx
What: Instead of just doing setCompletedSessions(v+1):
Call Supabase to insert a row into focus_sessions.
Read the selected plant's buildTime.
Automatically insert Math.floor(elapsed_minutes / buildTime) rows into garden_instances.
Reward the user with droplets based on duration.
[MODIFY] 
src/components/PlantShopSidebar.jsx
What: Fetch the user's user_inventory and profiles to determine if an item is locked or unlocked, and show the user's current droplet balance for purchasing. Hook up the "Buy" buttons to call the purchase_item RPC.
Analytics & Leaderboard Components (Future/Next Steps)
Once the schema is running, we can build custom Dashboards for Daily/Weekly stats and Global Leaderboards based on this newly structured data.
Verification Plan
Manual Verification
Database Schema: Execute the SQL on Supabase SQL Editor and ensure tables/RLS policies are created.
Focus Completion Flow:
Start the React dev server (npm run dev).
Run a short stopwatch/pomodoro session on the Focus Card and click Complete.
Check the focus_sessions and garden_instances tables in Supabase to verify the records appear correctly.
Store Flow:
Manually give the test user 500 droplets in Supabase.
Click "Buy" on a locked plant in the UI.
Verify that the droplet count decreases and the plant becomes owned in the UI immediately.
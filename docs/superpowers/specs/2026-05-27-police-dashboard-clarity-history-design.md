# Design Specification — Police Dashboard UI Polish & Mission History Logging

This spec details the UI updates to make the Police Dashboard visually self-explanatory and intuitive, and implements real-time history logging of clearances and SOS escorts using the Supabase `trip_logs` table.

---

## 1. Objectives

- **UI Self-Explanation**: Guide the officer through clearances, hotspots, and SOS rescues with tactical, clear, glassmorphic HUD tooltips and descriptors.
- **Mission History Logging**: Persistently store every completed junction clearance, deployment, and SOS escort resolution in the Supabase `trip_logs` table under the officer's UUID.
- **Mission History Timeline**: Add a new dashboard tab displaying a gorgeous scrollable log of all past actions, letting officers verify their logged activity.

---

## 2. Real-Time Logging Scheme (`trip_logs`)

Every action taken by the officer will insert a record into the `trip_logs` table:
- **Junction Cleared**:
  ```json
  {
    "trip_id": "trip_uuid",
    "actor_id": "officer_uuid",
    "action_type": "JUNCTION_CLEARED",
    "new_state": { "junction_id": "JN-112", "cleared_at": "timestamp" }
  }
  ```
- **SOS Escort Deployed**:
  ```json
  {
    "trip_id": "active_trip_uuid_or_null",
    "actor_id": "officer_uuid",
    "action_type": "SOS_ESCORT_DEPLOYED",
    "new_state": { "ambulance_id": "AMB-12", "timestamp": "timestamp" }
  }
  ```
- **SOS Escort Arrived**:
  ```json
  {
    "trip_id": "active_trip_uuid_or_null",
    "actor_id": "officer_uuid",
    "action_type": "SOS_ESCORT_ARRIVED",
    "new_state": { "ambulance_id": "AMB-12", "timestamp": "timestamp" }
  }
  ```
- **SOS Escort Resolved**:
  ```json
  {
    "trip_id": "active_trip_uuid_or_null",
    "actor_id": "officer_uuid",
    "action_type": "SOS_ESCORT_RESOLVED",
    "new_state": { "ambulance_id": "AMB-12", "timestamp": "timestamp" }
  }
  ```

---

## 3. UI/UX Modifications

### A. Dashboard Headers & Tooltips (`PoliceDashboard.tsx`)
- Embed glassmorphic guidance blocks describing how each module contributes to traffic optimization and priority lanes.
- Polish typography with modern monospaced tracking elements.

### B. Mission History Timeline (`PoliceDashboard.tsx` & `HistoryView.tsx`)
- Add `'history'` to the `viewState` enum.
- Add an interactive history button/tab in `TopBar.tsx` next to "Profile View".
- Create `HistoryView.tsx` component rendering a gorgeous chronological list of past logs fetched dynamically from `trip_logs`. Uses distinctive icons for junction clears vs panic escorts.

### C. Active Escort Card
- Visual alerts pulsing with warning overlays to distinguish police clearing junctions from active SOS escorts.

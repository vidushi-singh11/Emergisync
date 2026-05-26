# ⚡ EmergiSync — Real-Time Emergency Coordination Mesh

EmergiSync is a production-grade, real-time telemetry and coordination mesh designed to synchronize actions between **Ambulance Drivers**, **Hospital ER Staff**, and **Police Junction Controllers** under high-stress situations. By replacing manual phone calls and chat boxes with a dynamic, state-synchronized telemetry pipeline, it ensures seamless patient handoffs and optimized routing.

---

## 🚀 Key System Capabilities

### 1. Bidirectional Handoff Pipeline
- **Driver Intake Parameters**: Drivers fill out structured patient profiles (Severity L1-L4, Age Group, Special Needs like Ventilators/Oxygen, and clinical notes) before dispatch.
- **Dynamic Facility Live Stream**: The Driver's status bar updates in real-time, showing live ER/ICU bed capacities, distance, drive times, and diversion statuses.
- **Intake Flow Progression**: Hospital staff manage inbound arrivals through an interactive four-stage action bar:
  `ACKNOWLEDGE` ➔ `PREPARE ER` ➔ `MARK ER READY` (with trauma bay assignment) ➔ `CONFIRM RECEIPT`.
- **Auto-Increment Capacity**: Confirming patient receipt automatically increments the hospital's ER bed utilization and syncs with the Supabase database.
- **Arriving Now Flashing**: Cards flash red with high-impact "ARRIVING NOW" pulses once the ambulance is detected at the facility.

### 2. Active Trip Self-Healing & Locking
- **Double-Dispatch Prevention**: The status bar dynamically locks and turns grayscale during active missions, preventing accidental double dispatches.
- **Stale Active Trip Sweeper**: On dashboard mount, the application checks for any active trips. If duplicate active trips are found, it sorts them to display the most recent one and automatically sweeps/cancels older duplicate stale records in the database.
- **Safe-Wipe Resets**: Wipes local dashboard states and returns the driver UI to `'idle'` the moment the active trip status transitions to `'COMPLETED'` in Supabase.

### 3. Cybernetic Map Routing & Fallbacks
- **Cyan Glowing Route Paths**: Leaflet maps draw a semi-transparent wide neon cyan glow under a sharp core path.
- **Straight-Line Backup Path**: If the OSRM routing server is unreachable or fails to calculate a route, the map automatically draws a dashed direct path to ensure the driver is never left without guidance.

---

## 🔒 Database Security & RLS (Row-Level Security)

EmergiSync implements strict Row-Level Security policies to protect profile and telemetry records:

### Migration v3
Adds patient metadata fields (`age_group`, `special_needs`, `driver_note`), hospital response fields (`bay_note`, `ack_time`, `arrival_time`), and ICU bed capabilities to the database.

### Migration v4 (Base Profile Visibility Fix)
To prevent the ambulance picker from showing `"Unknown Hospital"`, **Migration v4** selectively enables authenticated drivers to read parent profiles specifically for hospital users, maintaining privacy for police and other units:
```sql
CREATE POLICY "Public Read Hospital Profiles Base" 
ON public.profiles 
FOR SELECT 
USING (role = 'hospital');
```

---

## ⚙️ Environment Configuration

To run the application, create a `.env.local` file inside the `frontend/` directory:

```bash
# frontend/.env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> [!CAUTION]
> Under no circumstances should `.env.local` or any private keys be committed to Git. The `.gitignore` has been updated to prevent this.

---

## 📂 Detailed Git Ignore Schema

The project includes a master [`.gitignore`](.gitignore) designed to prevent repository bloating and protect sensitive data:
- **Environment variables and keys** (`.env`, `.env.local`, `*.pem`, `*.key`) are strictly blacklisted.
- **Local editor and OS metadata** (`.vscode/`, `.idea/`, `.DS_Store`, `Thumbs.db`) are excluded to avoid configuration conflicts among developers.
- **Testing configurations and coverage reports** (`coverage/`, Playwright/Cypress results) are omitted to keep clean builds.
- **Dependencies** (`node_modules/`) and **compiler outputs** (`dist/`, `dist-ssr/`, `*.tsbuildinfo`) are blocked.

---

## 🛠️ Installation & Commands

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### Steps

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Verify & Build Client**:
   ```bash
   npm run build
   ```

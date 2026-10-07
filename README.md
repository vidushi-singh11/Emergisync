# ⚡ EmergiSync — Real-Time Emergency Coordination Mesh

EmergiSync is a production-grade, real-time telemetry and coordination mesh designed to synchronize actions between **Ambulance Drivers**, **Hospital ER Staff**, **Police Junction Controllers**, and **Control Room Dispatchers** under high-stress situations. By replacing manual phone calls and radio static with a dynamic, state-synchronized telemetry pipeline, it ensures seamless patient handoffs and optimized routing.

---

## 👥 The 4 Operational User Roles & Core Functionalities

EmergiSync partitions responsibilities across 4 distinct tactical portals, each equipped with role-specific views, workflows, and realtime permissions:

### 1. 🚑 Ambulance Driver (`ambulance`)
Field responders executing patient intake, transit, and hospital delivery.
- **Hardware GPS Streaming**: Automatically streams the driver's device coordinates (`navigator.geolocation`) to Cloud Firestore every 5 seconds.
- **Dynamic Facility Live Mesh**: Displays live capacity of nearby hospitals (available ER beds, ICU beds, trauma levels, diversion status).
- **Haversine Distance & Drive-Time ETA**: Real-time road distance and ETA calculated directly from the device's live coordinates to each facility.
- **Structured Patient Intake**: Captures patient severity (`CRITICAL_L1` to `MINOR_L4`), age group, special needs (ventilators, oxygen, trauma gear), and clinical notes.
- **Cybernetic Map Navigation**: Leaflet HUD map with glowing neon cyan OSRM driving routes and straight-line backup fallback paths.
- **Active Trip Self-Healing & Locking**: Grayscales and locks the dispatch selector during active missions to prevent double dispatches; auto-sweeps stale duplicate records.
- **Panic SOS Trigger**: Hardware panic trigger broadcasting high-priority emergency signals to the Command Center and deploying police escort units.
- **Handoff Progress Tracking**: Monitors destination ER stage in real time (`PENDING` ➔ `PREPARING` ➔ `READY` with trauma bay assignments ➔ `RECEIVED`).

---

### 2. 🏥 Hospital ER Staff (`hospital`)
Emergency department administrators and triage teams managing inbound patient flow and facility resource load.
- **Live Inbound Arrivals Monitor**: Visualizes all ambulances en route to the hospital with patient details, condition, clinical notes, and live ETA countdowns.
- **4-Stage Handoff Pipeline**:
  1. `ACKNOWLEDGE`: Confirms receipt of the inbound emergency broadcast.
  2. `PREPARE ER`: Alerts surgical and nursing teams to mobilize trauma resources.
  3. `MARK ER READY`: Declares the trauma bay prepped and assigns a specific bay (e.g., "Bay 3 - Trauma Team A").
  4. `CONFIRM RECEIPT`: Confirms patient physical arrival at the ER door.
- **Auto-Increment Capacity**: Confirming patient receipt automatically increments active bed usage in Firestore.
- **"ARRIVING NOW" Visual Radar**: Flashing visual alarms pulse red when an ambulance is within proximity of facility grounds.
- **Live Bed Capacity Management**: Toggle and adjust total and available ER beds, ICU beds, and staff count on the fly.
- **Diversion Status Control**: Enables the facility to declare diversion status when at capacity, instantly dimming and warning all inbound ambulances on the grid.
- **Emergency Dispatch Escalation**: One-click `⚠️ ESCALATE DISPATCH` button notifying the Control Room if bed availability crashes mid-transit.

---

### 3. 🚓 Police Junction Controller (`police`)
Traffic officers and corridor escorts stationed at intersections to guarantee unimpeded green corridors for emergency vehicles.
- **Tactical Junction Radar Map**: Real-time GIS map displaying assigned intersection corridors and approaching ambulances.
- **Corridor Clearance Flow**:
  1. `ALERT SENT`: Receives route-crossing alerts with live ETA countdowns for inbound ambulances.
  2. `ACKNOWLEDGE`: Confirms officer has received the clearance request.
  3. `MARK CLEARED`: Manually confirms signals overridden and traffic cleared for the oncoming ambulance.
- **Traffic Escalation Trigger**: Flags heavily blocked intersections or road accidents back to the Command Center to divert ambulances to alternate routes.
- **Ambulance SOS Escort Missions**: Responds to ambulance panic signals with distance tracking (`Acknowledge & Deploy` ➔ `Confirm Arrival & Secure` ➔ `Stand Down`).
- **Officer Mission History Log**: Full auditable archive of cleared corridors, timestamps, and escort missions.

---

### 4. 🎛️ Control Room Dispatcher (`control`)
Central command bridge with global oversight, routing override authority, and cross-agency coordination.
- **Global Fleet & Grid Map**: Interactive GIS tracking all active ambulance units, hospital locations, and online police officers on a unified map.
- **Live Telemetry & Anomaly Detection**:
  - *Ghost Units*: Detects ambulances on active trips with lost telemetry or delayed pings (>45s).
  - *Slow Hospital Nudges*: Identifies facilities with critical inbound patients that have failed to acknowledge within 3 minutes, dispatching direct audible nudges.
  - *Corridor Bottlenecks*: Flags junctions with multiple crossing trips for immediate police reinforcement.
- **Cross-Agency Broadcast Mesh**: Global push broadcast marquee across all active ambulance, hospital, and police screens.
- **Route Override & Bypass**: Direct authority to reroute an ambulance to an alternate hospital or send direct tactical text-to-speech notices to drivers.
- **Panic SOS Command Console**: Fullscreen audiovisual alert override dispatching the closest police patrol to guard compromised ambulance units.
- **Audit Logs & Telemetry Health**: Live inspection of system latency, WebSocket channel feeds, and inter-agency dispatch timings.

---

## 🔒 Security & Data Architecture

- **Firebase Authentication**: Role-gated authentication with session persistence (`auth.authStateReady()`) preventing logout on page reload.
- **Cloud Firestore**: Realtime document streams mapped with structured security rules in `firestore.rules`.
- **Composite Query Indexes**: Preconfigured compound index schemas in `firestore.indexes.json` for high-throughput multi-field queries.

---

## ⚙️ Environment Configuration

Create a `.env` or `.env.local` file inside the `frontend/` directory with your Firebase Web App credentials:

```bash
# frontend/.env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

> [!CAUTION]
> Never commit private service account keys or `.env.local` to Git.

---

## 🛠️ Installation & Local Development

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### Steps

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

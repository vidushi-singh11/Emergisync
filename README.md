# ⚡ EmergiSync — Real-Time Emergency Coordination Mesh

EmergiSync is a production-grade, real-time telemetry and coordination mesh designed to synchronize actions between **Ambulance Drivers**, **Hospital ER Staff**, **Police Junction Controllers**, and **Control Room Dispatchers** under high-stress situations. By replacing manual phone calls and radio static with a dynamic, state-synchronized telemetry pipeline, it ensures seamless patient handoffs and optimized routing.

---

## 👥 The 4 Operational User Roles & Core Functionalities

### 1. 🚑 Ambulance Driver (`ambulance`)
Field units handling patient intake, live routing, and hospital transfer.
- **Live Device GPS**: Streams physical device location to Cloud Firestore every 5s.
- **Facility Mesh**: Real-time hospital selector with live ER/ICU bed capacity, trauma levels, and diversion warnings.
- **Live Distance & ETA**: Road distance and drive-time ETA auto-calculated from driver's device coordinates.
- **Patient Intake**: Quick triage input (Severity L1-L4, age group, special equipment needs, notes).
- **Navigation HUD**: Leaflet map with neon cyan route guidance and OSRM fallbacks.
- **Panic SOS**: One-tap emergency broadcast requesting immediate police escort.
- **Status Sync**: Tracks destination hospital readiness stages in real-time.

---

### 2. 🏥 Hospital ER Staff (`hospital`)
Facility triage and emergency department teams managing inbound patient flow.
- **Inbound Patient Radar**: Live queue of en route ambulances with patient vitals and ETA countdowns.
- **4-Stage Handoff Pipeline**: `ACKNOWLEDGE` ➔ `PREPARE ER` ➔ `MARK READY` (assign trauma bay) ➔ `CONFIRM RECEIPT`.
- **Bed Management**: Real-time ER/ICU bed counters that auto-increment on patient admission.
- **Diversion Toggle**: Declare facility diversion to warn inbound drivers when at capacity.
- **Arrival Alarms**: Flashing red visual alerts when an ambulance reaches the facility.
- **Dispatch Escalation**: Flag inbound transfers to Control Room if trauma resources crash mid-transit.

---

### 3. 🚓 Police Junction Controller (`police`)
Traffic officers managing green corridors and emergency escorts.
- **Corridor Clearance**: Receive junction alerts and manually clear traffic for approaching ambulances.
- **Clearance Workflow**: `ALERT SENT` ➔ `ACKNOWLEDGE` ➔ `MARK CLEARED`.
- **Traffic Escalation**: Report severe intersection blocks to re-route ambulances via alternate roads.
- **SOS Escort Missions**: Respond to ambulance panic signals and secure field units.
- **Mission History**: Searchable log of completed clearances and response times.

---

### 4. 🎛️ Control Room Dispatcher (`control`)
Central command hub with global oversight and cross-agency override authority.
- **Global GIS Map**: Unified live map tracking all active ambulances, hospitals, and police patrols.
- **Anomaly Detection**: Flags ghost units (lost telemetry), slow hospital responses, and junction bottlenecks.
- **Route Override**: Direct authority to re-route ambulances to alternate facilities and push audio notices.
- **Global Broadcasts**: Push urgent system-wide announcements across all operational screens.
- **Panic SOS Bridge**: Direct dispatch interface pairing compromised ambulances with nearest police units.

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

# ⚡ EmergiSync — Frontend Client Application

This directory houses the frontend React + Vite + TypeScript application for the EmergiSync Real-Time Emergency Coordination Mesh.

For full system architecture, database migrations, security RLS policies, and configurations, please refer to the master [README.md](../README.md) in the root directory of this repository.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Secrets
Create a `.env.local` file in this directory and populate your Supabase endpoint:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 🛠️ Tech Stack & Structure
- **Core**: React (v19) + Vite + TypeScript
- **Styling**: Vanilla CSS + Tailwind CSS (under `/src/index.css`)
- **Database / Realtime**: Supabase Client SDK
- **Maps / Navigation**: Leaflet + React Leaflet + OSRM routing fallbacks

---

## 🔒 Security Hygiene
- Local environment files (`.env`, `.env.local`, `*.env`) and private keys are ignored via the master [`.gitignore`](../.gitignore).
- Production TypeScript compilation is strictly enforced via `tsconfig.json` using strict compiler checks (`verbatimModuleSyntax` enabled).

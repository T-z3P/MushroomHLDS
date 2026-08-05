# MushroomHLDS — Half-Life 1 & Mod Management Panel

MushroomHLDS is a full-stack, containerized game panel built specifically for **Half-Life 1**, **Counter-Strike 1.6**, **Day of Defeat**, **Condition Zero**, and all other **GoldSrc / HLDS engine mods**. Designed with a modern aesthetic inspired by Home Assistant's Mushroom UI, MushroomHLDS provides a sleek, real-time control room for your self-hosted servers.

---

## 🚀 Features

* **Mushroom UI Card Layout:** Responsive, soft-elevation dashboard cards with active status pulses, live player counters, and quick power controls (start, stop, restart).
* **Live Server Querying:** UDP A2S server polling displaying current active maps, real-time player counts, and maximum player slots.
* **Interactive RCON Console:** Built-in web terminal sending challenge-authenticated UDP RCON commands directly to GoldSrc server instances.
* **Mod Integration (+AMX Mod X & Metamod):** Direct setup integration for Metamod DLL linkage and AMX Mod X directory structures.
* **SteamCMD Auto-Downloads & Local Storage:** Download fresh HLDS binaries via SteamCMD or attach to existing directories on local disk.
* **Host Machine Stats:** Real-time host VM CPU load, memory usage (Used/Total GB and percentage), and system uptime tracking.
* **Audit Logging:** Logs the last 15 operational actions performed across the panel (power toggles, instance creation, RCON executions).
* **Docker Native:** Runs completely containerized with socket binding to spawn and manage child HLDS containers using persistent host mounts.

---

## 🛠 Tech Stack

* **Frontend:** Vue 3, Vite, Tailwind CSS v4
* **Backend:** Fastify (Node 20+), `@fastify/websocket`, `@fastify/static`
* **Query & Management:** `gamedig` (A2S query), `node-rcon` (UDP RCON), `dockerode` (Docker API)
* **Database & System Metrics:** `better-sqlite3`, `systeminformation`

---

## 📁 Directory Structure

```MushroomHLDS/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── db.js
│       ├── server.js
│       └── services/
│           ├── hldsManager.js
│           ├── rcon.js
│           └── sysStats.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.vue
        ├── main.js
        ├── assets/
        │   └── main.css
        └── components/
            ├── ActionLogs.vue
            ├── HostStatCard.vue
            ├── RconConsole.vue
            └── ServerMushroomCard.vue
```
---

## 📦 Deployment & Setup Guide

### Prerequisites
* Docker Engine (20.10+)
* Docker Compose (v2.0+)
* Host persistent directory created: `/srv/hlds/servers`

### Production Docker Deployment Steps

1. Clone Repository & Navigate to Directory:
   ```
   git clone git@github.com:T-z3P/MushroomHLDS.git
   cd MushroomHLDS
   ```

2. Set Up Storage Directories:
   ```
   sudo mkdir -p /srv/hlds/servers ./data
   sudo chown -R $USER:$USER /srv/hlds/servers ./data
   ```

3. Build & Launch Application:
   ```
   docker compose up -d --build
   ```

5. Access UI:
   Navigate to `http://<SERVER_IP>:3000` in your web browser.

---

## ⚡ Development Setup

To run backend and frontend separately for local development:

1. Backend Server:
   ```
   cd backend
   npm install
   npm start
   ```

2. Frontend Dev Server:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   
   Access the portal at http://localhost:5173 (API requests proxy automatically to port 3000).

---

> ⚠️ **Disclaimer:** This application has been fully vibe coded by AI. Use of this software is entirely at your own risk.

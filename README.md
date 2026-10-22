# Blockchain-Based Blue Carbon Registry & MRV System

A governed, auditable platform for **Mangrove Restoration Site Registration, Sentinel-2 Remote-Sensing MRV, and Capacity Management** focused on Indian coastal mangrove ecosystems (Pilot Site: **Pichavaram Mangrove Forest, Tamil Nadu**).

---

## 1. Key Capabilities & Architectural Invariants

1. **Geospatial Boundary Ingestion & Geodesic Calculation:**
   - Validates boundary polygons against strict RFC 7946 specifications (`EPSG:4326`, coordinate bounds, ring closure, self-intersection rejection using `shapely`).
   - Computes defensible surface area on the WGS84 ellipsoid using `pyproj.Geod` rather than naive planar math.

2. **Copernicus Sentinel-2 Remote-Sensing MRV:**
   - Analyzes multispectral bands: Band 4 Red (10m), Band 8 NIR (10m), and Band 11 SWIR (20m).
   - Computes **NDVI at native 10m** and **NDMI at native 20m** (by area-averaging Band 8 to 20m).
   - Enforces an automated **Cloud Quality Gate**: Scenes with valid pixel ratio $< 70\%$ or cloud cover $> 25\%$ are flagged as `INCONCLUSIVE_DATA_QUALITY` and are prohibited from altering capacity.
   - Evaluates canopy cover proxy and change detection rules ($\Delta\text{NDVI} < -15\%$, $\Delta\text{Area} < -10\%$).

3. **Governed Capacity Ledger & Deficit Invariant:**
   - Strictly separates **Estimated Provisional Capacity** ($C_{\text{est}}$) from **Approved Capacity** ($C_{\text{app}}$).
   - Enforces future issuance ceiling:
     $$C_{\text{avail}} = \max(0, C_{\text{app}} - C_{\text{issued}})$$
   - **Protection of Issued Credits:** In accordance with carbon accounting standards, satellite degradation **never automatically freezes, cancels, or confiscates credits already issued to companies**.
   - If an auditor reduces approved capacity below historical issued credits, an **Issuance Deficit** is recorded:
     $$C_{\text{deficit}} = \max(0, C_{\text{issued}} - C_{\text{app}})$$
     Future issuance is halted ($C_{\text{avail}} = 0$) while existing issued credits remain safe.

4. **Audit Trail & Cryptographic Evidence:**
   - Logs every registration, satellite observation, anomaly flag, and auditor sign-off.
   - Accompanied by SHA-256 evidence package digests.

---

## 2. UI / UX Design Principles

In strict adherence to the project design guidelines:
- **Clean Minimal Light Theme:** White (`#ffffff`) and soft light-gray (`#f8fafc`) backgrounds.
- **Cool Natural Colors:**
  - **Primary:** Soft Teal / Ocean Blue (`#0f766e`, `#0d9488`)
  - **Secondary:** Soft Green (`#15803d`, `#16a34a`)
  - **Accent:** Calm Sky Blue (`#0284c7`, `#38bdf8`)
  - **Text:** Dark Slate Gray (`#1e293b`, `#334155`)
- **Zero Distractions:** No dark theme, no glowing neon effects, no glassmorphism, no hover scale effects, no transitions.
- **Unified Clean Dashboard:** Everything is accessible from a single, well-structured screen.

---

## 3. Technology Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy (SQLite), Pydantic v2, Shapely, PyProj.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet.js (`leaflet`), Lucide React.
- **Evidence Storage:** Local content-addressed vault with SHA-256 hashing.

---

## 4. How to Run the Application

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Quick Start

1. **Activate Virtual Environment & Start Backend:**
   ```powershell
   # In project root:
   .\venv\Scripts\Activate.ps1
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start Frontend Dev Server:**
   ```powershell
   # In a second terminal:
   cd frontend
   npm run dev -- --host 127.0.0.1 --port 3000
   ```

3. **Access the Dashboard:**
   Open your browser and navigate to:
   **`http://localhost:3000`**

---

## 5. Demonstration Walkthrough Script

1. **Overview:** Inspect the top metrics bar showing 3 pre-seeded Pichavaram restoration plots, total area, and current capacity balances.
2. **Interactive GIS Map:** Click between the sites (`IND-TN-PIC-001`, `IND-TN-PIC-002`, `IND-TN-PIC-003`) on the Leaflet map to fly to their boundaries and view their health status.
3. **Register New Site:** Click **"Register Site"**, click **"Insert Sample Pichavaram Polygon"**, and submit. Observe instant geodesic area computation and polygon rendering on the map.
4. **Satellite MRV Observations:** View the latest Sentinel-2 NDVI (10m) and NDMI (native 20m) indices, as well as the historical observation timeline.
5. **Simulate Storm & Review Anomaly:** Click **"Simulate Storm Anomaly"** on a healthy site. Observe the system immediately flagging `ANOMALY_FLAGGED`, moving the site status to `UNDER_REVIEW`, and freezing future issuance.
6. **Auditor Review & Issuance Deficit:** Use the **Auditor Review Form** to lower approved capacity ($C_{\text{app}}$) below issued credits ($C_{\text{issued}}$). Observe $C_{\text{avail}}$ dropping to $0$ and an **Issuance Deficit** recorded without revoking or deleting previously issued credits!
7. **Audit Log:** Search the audit trail table at the bottom of the dashboard to inspect timestamps and SHA-256 evidence digests.
8. **Reset Demo:** Click **"Reset Demo"** in the top header at any time to restore the baseline Pichavaram demonstration state.


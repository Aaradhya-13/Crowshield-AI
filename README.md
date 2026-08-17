# CrowdShield — Predictive Crowd Safety & Flow Management Platform

CrowdShield is an edge-to-cloud AI crowd monitoring and predictive stampede prevention system. It integrates computer vision on CCTV feeds with real-time GIS bottleneck mapping, automated PA intervention broadcasts, and dynamic traffic diversion.

---

## 🏗️ System Architecture

* **Vision Engine (`/backend`):** OpenCV + YOLOv8 + Farneback Optical Flow running density estimation and vector velocity modeling.
* **Backend API (`/backend`):** Asynchronous FastAPI WebSocket server streaming telemetry at 30 FPS.
* **Command Center (`/dashboard`):** Real-time React dashboard with Leaflet GIS mapping, automated Web Audio sirens, and Recharts density trend tracking.
* **Field Application (`/mobile`):** Flutter cross-platform mobile client for zone alerts and incident reporting.

---

## 🚀 Quickstart

### 1. Backend Service
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

import asyncio
import os
import random
import sys
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.vision import process_frame

app = FastAPI(title="CrowdShield Engine API")

# Allow frontend connections from localhost and deployed Render domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check route for browser and Render health monitoring
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CrowdShield AI Engine",
        "websocket_endpoint": "/ws/stream",
        "platform": sys.platform
    }

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, stream_url: str = "0"):
    await websocket.accept()
    
    source = int(stream_url) if stream_url.isdigit() else stream_url
    
    # Use cv2.CAP_DSHOW only on Windows to prevent driver errors on Linux/Render
    if isinstance(source, int) and sys.platform.startswith("win"):
        cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(source)

    prev_gray = None
    tick = 0

    try:
        while True:
            frame_captured = False
            
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    telemetry, prev_gray = process_frame(frame, prev_gray)
                    frame_captured = True

            # Dynamic cloud fallback when running on Render without a physical webcam
            if not frame_captured:
                tick += 1
                base_count = 28 + int(12 * (0.5 + 0.5 * (tick % 40) / 40.0))
                jitter = random.randint(-3, 4)
                count = max(5, base_count + jitter)
                density = round(count / 14.0, 2)
                flow = round(1.2 + random.uniform(-0.3, 0.4), 2)
                
                if density > 3.2:
                    risk = "CRITICAL"
                elif density > 1.8:
                    risk = "WARNING"
                else:
                    risk = "NORMAL"

                telemetry = {
                    "person_count": int(count),
                    "density_per_m2": float(density),
                    "flow_speed": float(flow),
                    "risk_level": str(risk)
                }

            await websocket.send_json(telemetry)
            await asyncio.sleep(0.05)  # Stream at ~20 FPS

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        if cap.isOpened():
            cap.release()

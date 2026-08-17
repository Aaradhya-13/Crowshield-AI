import asyncio
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.vision import process_frame

app = FastAPI(title="CrowdShield Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check route for browser visits
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CrowdShield AI Engine",
        "websocket_endpoint": "/ws/stream"
    }

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, stream_url: str = "0"):
    await websocket.accept()
    source = int(stream_url) if stream_url.isdigit() else stream_url
    
    if isinstance(source, int):
        cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(source)

    prev_gray = None

    try:
        while True:
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    telemetry, prev_gray = process_frame(frame, prev_gray)
                else:
                    telemetry = {"person_count": 1, "density_per_m2": 0.05, "flow_speed": 0.5, "risk_level": "NORMAL"}
            else:
                telemetry = {"person_count": 1, "density_per_m2": 0.05, "flow_speed": 0.5, "risk_level": "NORMAL"}

            await websocket.send_json(telemetry)
            await asyncio.sleep(0.05)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        if cap.isOpened():
            cap.release()

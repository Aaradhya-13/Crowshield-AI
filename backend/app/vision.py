import cv2
import numpy as np
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

def process_frame(frame, prev_gray=None):
    # Perform YOLOv8 person detection with stream=True generator
    results = list(model(frame, verbose=False, classes=[0], stream=True))
    raw_person_count = len(results[0].boxes) if results else 0

    # Convert to grayscale for Optical Flow
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    flow_speed = 0.0

    if prev_gray is not None:
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
        )
        magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        flow_speed = float(np.mean(magnitude))

    # --- DEMO SURGE SCALER FOR TESTING BOTTLENECKS ---
    if flow_speed > 3.0 or raw_person_count > 1:
        simulated_count = max(raw_person_count * 15, 35)
        density = round(simulated_count / 8.0, 2)
    else:
        simulated_count = max(raw_person_count, 1)
        density = round(simulated_count / 30.0, 2)

    # Risk Assessment Logic
    if density > 3.5 or flow_speed > 5.0:
        risk_level = "CRITICAL"
    elif density > 1.5 or flow_speed > 2.5:
        risk_level = "WARNING"
    else:
        risk_level = "NORMAL"

    # Explicitly cast types to standard Python primitives for clean JSON serialization
    telemetry = {
        "person_count": int(simulated_count),
        "density_per_m2": float(density),
        "flow_speed": float(round(flow_speed, 2)),
        "risk_level": str(risk_level),
    }

    return telemetry, gray

# Alias export for compatibility
process_stream = process_frame
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dependencies import get_current_user
from database import supabase
from datetime import datetime, timezone

app = FastAPI(title="Monitoring Dashboard API")

# Configure CORS so React app can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # You should restrict this in production (e.g., ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Sensor field to threshold sensor_id mapping ───
SENSOR_FIELD_MAP = {
    "suhu_rumah_kaca": "suhu_rumah_kaca",
    "temperature": "suhu_rumah_kaca",
    "kelembapan": "kelembapan",
    "humidity": "kelembapan",
    "intensitas_cahaya": "intensitas_cahaya",
    "light": "intensitas_cahaya",
    "ph": "ph",
    "tds": "tds",
    "suhu_larutan": "suhu_larutan",
    "water_temp": "suhu_larutan",
}


def check_thresholds_and_update_actuators(payload: dict):
    """
    Core auto-trigger logic:
    For each sensor value in the payload, check against sensor_thresholds.
    If out of range → turn the linked actuator ON.
    If within range → turn it OFF.
    """
    if not supabase:
        return

    try:
        # Fetch all thresholds
        thresholds_resp = supabase.table("sensor_thresholds").select("*").execute()
        thresholds = {t["sensor_id"]: t for t in (thresholds_resp.data or [])}

        # Track which actuators need updating
        actuator_updates = {}

        for field_key, value in payload.items():
            # Skip non-sensor fields
            if field_key in ("created_at", "id", "device_id"):
                continue

            # Map the payload field to a sensor_id
            sensor_id = SENSOR_FIELD_MAP.get(field_key, field_key)

            if sensor_id not in thresholds:
                continue

            threshold = thresholds[sensor_id]
            actuator_id = threshold.get("actuator_id")
            if not actuator_id:
                continue

            try:
                sensor_value = float(value)
            except (ValueError, TypeError):
                continue

            min_val = threshold["min_value"]
            max_val = threshold["max_value"]
            action = threshold.get("action_on_breach", "turn_on")

            # Determine if out of range
            is_out_of_range = sensor_value < min_val or sensor_value > max_val

            if action == "turn_on":
                should_be_on = is_out_of_range
            else:
                should_be_on = not is_out_of_range

            # Store the update (last sensor wins if multiple map to the same actuator)
            actuator_updates[actuator_id] = {
                "is_on": should_be_on,
                "triggered_by": sensor_id if should_be_on else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

        # Apply updates to actuator_states
        for act_id, update_data in actuator_updates.items():
            supabase.table("actuator_states").update(update_data).eq("id", act_id).execute()

    except Exception as e:
        print(f"[Threshold Check Error] {e}")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Monitoring Dashboard API"}

@app.get("/api/secure-data")
def read_secure_data(user = Depends(get_current_user)):
    """
    Example of a secure endpoint.
    It requires a valid Supabase JWT token passed in the Authorization header.
    """
    return {
        "message": "You have successfully accessed a secure endpoint!",
        "user_email": user.email,
        "user_id": user.id
    }

@app.get("/api/sensors")
def get_sensor_data_example(user = Depends(get_current_user)):
    """
    Example of an endpoint interacting with Supabase DB securely from React.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}
    
    return {"message": "Database query placeholder"}

@app.post("/api/sensor-data")
async def receive_sensor_data(request: Request):
    """
    Endpoint for your Microcontroller (ESP32/Arduino) to send data.
    This is public so your MCU doesn't need complex JWT logic.
    After saving sensor data, it automatically checks thresholds
    and updates actuator states.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}
        
    try:
        # 1. Read the JSON sent by your microcontroller
        payload = await request.json()
        
        # 2. Save it directly to Supabase
        # IMPORTANT: Change "sensor_readings" if you named your table something else!
        response = supabase.table("sensor_readings").insert(payload).execute()
        
        # 3. Auto-trigger: check thresholds and update actuator states
        check_thresholds_and_update_actuators(payload)
        
        return {"success": True, "message": "Data saved & actuators updated!", "saved_data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─── Actuator State Endpoints ───

@app.get("/api/actuator-states")
def get_actuator_states():
    """
    ESP32 polls this endpoint to know which relays to turn ON/OFF.
    This is public (no auth) so the ESP32 can call it easily.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}

    try:
        response = supabase.table("actuator_states").select("*").execute()
        return {"actuators": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/actuator-states/{actuator_id}")
async def update_actuator_state(actuator_id: str, request: Request):
    """
    Manually toggle an actuator from the dashboard.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}

    try:
        body = await request.json()
        update_data = {
            "is_on": body.get("is_on", False),
            "triggered_by": body.get("triggered_by", "manual"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        response = supabase.table("actuator_states").update(update_data).eq("id", actuator_id).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Sensor Threshold Endpoints ───

@app.get("/api/sensor-thresholds")
def get_sensor_thresholds():
    """
    Get all sensor threshold configurations.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}

    try:
        response = supabase.table("sensor_thresholds").select("*").execute()
        return {"thresholds": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sensor-thresholds/{sensor_id}")
async def update_sensor_threshold(sensor_id: str, request: Request):
    """
    Update threshold min/max for a specific sensor from the dashboard.
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}

    try:
        body = await request.json()
        update_data = {
            "min_value": body.get("min_value"),
            "max_value": body.get("max_value"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        response = supabase.table("sensor_thresholds").update(update_data).eq("sensor_id", sensor_id).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

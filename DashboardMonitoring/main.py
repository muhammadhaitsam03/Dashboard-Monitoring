from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from DashboardMonitoring.dependencies import get_current_user
from DashboardMonitoring.database import supabase
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Literal, Optional
import csv
import os
from zoneinfo import ZoneInfo
import json
from urllib.request import Request as UrlRequest, urlopen
from urllib.error import URLError, HTTPError

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

def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]

def _ai_model_dir() -> Path:
    return _repo_root() / "Ai_model"

def _parse_float(v: Any) -> Optional[float]:
    try:
        if v is None:
            return None
        return float(v)
    except Exception:
        return None

def _get_tz() -> ZoneInfo:
    name = os.environ.get("FORECAST_TZ", "Asia/Jakarta")
    try:
        return ZoneInfo(name)
    except Exception:
        try:
            return ZoneInfo("Asia/Jakarta")
        except Exception:
            # Windows machines may lack tzdata; fall back to WIB fixed offset (+07:00)
            return timezone(timedelta(hours=7))

def _parse_now_param(now: Optional[str]) -> Optional[datetime]:
    if not now:
        return None
    try:
        s = now.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        tz = _get_tz()
        if dt.tzinfo is None:
            return dt.replace(tzinfo=tz)
        return dt.astimezone(tz)
    except Exception:
        return None

def _floor_to_hour(dt: datetime) -> datetime:
    return dt.replace(minute=0, second=0, microsecond=0)

def _read_prediction_forecast_rows() -> list[dict[str, Any]]:
    """
    Reads Ai_model/prediction_forecast.csv:
    time,suhu,cuaca,humidity,light_intensity,ph,precipitation
    """
    csv_path = _ai_model_dir() / "prediction_forecast.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"Forecast CSV not found at {csv_path}")

    rows: list[dict[str, Any]] = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            t = r.get("time")
            if not t:
                continue
            try:
                dt = datetime.strptime(t, "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue

            rows.append(
                {
                    "time": dt.isoformat(),
                    "suhu": _parse_float(r.get("suhu")),
                    "cuaca": _parse_float(r.get("cuaca")),
                    "humidity": _parse_float(r.get("humidity")),
                    "light_intensity": _parse_float(r.get("light_intensity")),
                    "ph": _parse_float(r.get("ph")),
                    "precipitation": _parse_float(r.get("precipitation")),
                }
            )

    rows.sort(key=lambda x: x["time"])
    return rows

def _weather_label(code: Optional[float]) -> str:
    if code is None:
        return "unknown"
    c = int(round(code))
    return {
        0: "clear",
        1: "cloudy",
        2: "rain",
        3: "storm",
    }.get(c, f"code_{c}")

def _find_row_index_at_or_after(rows: list[dict[str, Any]], target: datetime) -> int:
    # CSV times are treated as local wall-clock timestamps (no tz offset in file)
    t_iso = target.replace(tzinfo=None).isoformat()
    for i, r in enumerate(rows):
        if r["time"] >= t_iso:
            return i
    return max(0, len(rows) - 1)

@app.get("/api/forecast")
def get_forecast(hours: int = 24, now: Optional[str] = None):
    """
    Forecast values sourced from Ai_model/prediction_forecast.csv.
    - hours: number of rows to return starting from the current hour.
    - now: optional ISO timestamp from client to align with real local time.
    """
    rows = _read_prediction_forecast_rows()
    if not rows:
        raise HTTPException(status_code=500, detail="Forecast CSV is empty or unreadable")

    tz = _get_tz()
    client_now = _parse_now_param(now)
    effective_now = client_now or datetime.now(tz)
    effective_now = _floor_to_hour(effective_now)

    start_idx = _find_row_index_at_or_after(rows, effective_now)
    end_idx = min(len(rows), start_idx + max(1, min(168, hours)))
    window = rows[start_idx:end_idx]
    current = window[0] if window else rows[start_idx]

    return {
        "source": "prediction_forecast.csv",
        "timezone": str(tz),
        "now_hour": effective_now.isoformat(),
        "current_hour": {
            **current,
            "cuaca_label": _weather_label(current.get("cuaca")),
        },
        "next": [
            {
                **r,
                "cuaca_label": _weather_label(r.get("cuaca")),
            }
            for r in window
        ],
    }

def _heuristic_recommendation(current: dict[str, Any], forecast: list[dict[str, Any]]) -> str:
    def _n(v: Any) -> Optional[float]:
        try:
            if v is None:
                return None
            x = float(v)
            return x
        except Exception:
            return None

    suhu = _n(current.get("suhu_rumah_kaca") or current.get("suhu") or current.get("temperature"))
    hum = _n(current.get("kelembapan") or current.get("humidity"))
    light = _n(current.get("intensitas_cahaya") or current.get("light") or current.get("light_intensity"))
    ph = _n(current.get("ph"))

    notes: list[str] = []
    if suhu is not None and suhu > 24:
        notes.append("Suhu terlalu tinggi; tingkatkan ventilasi/kipas atau pendinginan untuk mendekati 18–24°C.")
    elif suhu is not None and suhu < 18:
        notes.append("Suhu terlalu rendah; pertimbangkan pemanas/isolasi agar mendekati 18–24°C.")

    if hum is not None:
        # accept either 0-1 or percent
        hum_norm = hum if hum <= 1.5 else (hum / 100.0)
        if hum_norm > 0.70:
            notes.append("Kelembapan tinggi; tingkatkan sirkulasi udara agar stabil di 0.50–0.70.")
        elif hum_norm < 0.50:
            notes.append("Kelembapan rendah; pertimbangkan humidifier/misting agar stabil di 0.50–0.70.")

    if light is not None and light < 150:
        notes.append("Intensitas cahaya rendah; tingkatkan pencahayaan (sesuaikan dengan unit sensor).")
    elif light is not None and light > 600:
        notes.append("Intensitas cahaya tinggi; pertimbangkan shading atau atur photoperiod untuk menghindari stress.")

    if ph is not None and (ph < 6.0 or ph > 7.0):
        notes.append("pH di luar 6.0–7.0; lakukan koreksi bertahap dan ukur ulang setelah stabil.")

    if forecast:
        lbl = forecast[0].get("cuaca_label")
        if lbl in ("rain", "storm"):
            notes.append("Perkiraan cuaca buruk; antisipasi lonjakan kelembapan dan lindungi perangkat.")

    if not notes:
        return "Kondisi saat ini terlihat stabil. Lanjutkan monitoring dan lakukan penyesuaian bertahap."
    return " ".join(notes)

def _ollama_chat(prompt: str) -> str:
    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b")
    url = f"{base}/api/chat"
    body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are an agronomy assistant for a greenhouse hydroponic system. Be concise, actionable, and avoid unsafe advice.",
            },
            {"role": "user", "content": prompt},
        ],
        "stream": False,
    }
    req = UrlRequest(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        msg = (data or {}).get("message") or {}
        return str(msg.get("content") or "").strip()

@app.post("/api/recommendation")
async def recommend(request: Request):
    """
    Returns recommendations from local LLM (Ollama) if available,
    otherwise falls back to a heuristic recommender.
    """
    payload = await request.json()
    current = payload.get("current") or {}
    forecast = payload.get("forecast") or []

    prompt = (
        "Given these greenhouse readings and forecast, give 3-6 bullet recommendations.\n\n"
        f"CURRENT:\n{json.dumps(current, ensure_ascii=False)}\n\n"
        f"FORECAST(next):\n{json.dumps(forecast[:12], ensure_ascii=False)}\n"
    )

    provider: Literal["ollama", "none"] = os.environ.get("RECO_PROVIDER", "ollama")
    if provider == "ollama":
        try:
            text = _ollama_chat(prompt)
            if text:
                return {"provider": "ollama", "text": text}
        except (URLError, HTTPError, TimeoutError, Exception):
            pass

    return {"provider": "heuristic", "text": _heuristic_recommendation(current, forecast)}

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

@app.post("/api/actuator-data")
async def receive_actuator_data(request: Request):
    """
    Endpoint for the ESP32/microcontroller to report actual relay states.
    The MCU sends 1 (relay ON) or 0 (relay OFF) for each actuator.

    Example payload from ESP32:
    {
        "exhaust_fan": 1,
        "pompa_misting": 0,
        "led_grow_light": 1,
        "pompa_sirkulasi": 1,
        "pompa_ph_up": 0,
        "pompa_ph_down": 0,
        "pompa_air_bersih": 0,
        "pompa_nutrisi_a": 1,
        "pompa_nutrisi_b": 1,
        "kipas_pendingin": 0
    }
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}

    try:
        payload = await request.json()
        updated = []
        errors = []

        for actuator_id, raw_value in payload.items():
            try:
                is_on = bool(int(raw_value))  # 1 → True, 0 → False
            except (ValueError, TypeError):
                errors.append(f"Invalid value for '{actuator_id}': {raw_value}")
                continue

            update_data = {
                "is_on": is_on,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            supabase.table("actuator_states").update(update_data).eq("id", actuator_id).execute()
            updated.append(actuator_id)

        return {
            "success": True,
            "updated": updated,
            "errors": errors,
            "message": f"{len(updated)} actuator(s) updated from ESP32 report."
        }

    except Exception as e:
        return {"success": False, "error": str(e)}



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

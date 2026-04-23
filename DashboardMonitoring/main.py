from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dependencies import get_current_user
from database import supabase

app = FastAPI(title="Monitoring Dashboard API")

# Configure CORS so React app can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # You should restrict this in production (e.g., ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# prabowo kontol

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
    """
    if not supabase:
        return {"error": "Supabase client not initialized"}
        
    try:
        # 1. Read the JSON sent by your microcontroller
        payload = await request.json()
        
        # 2. Save it directly to Supabase
        # IMPORTANT: Change "sensor_readings" if you named your table something else!
        response = supabase.table("sensor_readings").insert(payload).execute()
        
        return {"success": True, "message": "Data saved to Supabase!", "saved_data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}

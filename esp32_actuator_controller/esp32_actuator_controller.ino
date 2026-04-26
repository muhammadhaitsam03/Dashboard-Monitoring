/*
 * ============================================
 * ESP32 Actuator Controller + Sensor Sender
 * Dashboard Monitoring System
 * ============================================
 * 
 * This sketch does two things:
 * 1. Reads sensors and sends data to FastAPI → Supabase
 * 2. Polls actuator states from FastAPI and controls relays
 * 
 * Libraries needed (install via Arduino Library Manager):
 * - ArduinoJson (by Benoit Blanchon)
 * - WiFi (built-in for ESP32)
 * - HTTPClient (built-in for ESP32)
 * 
 * Hardware:
 * - ESP32 DevKit
 * - 6-channel Relay Module (active-LOW assumed)
 * - Sensors: DHT22, BH1750, pH sensor, TDS sensor, DS18B20
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─── WiFi Configuration ───
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── Server Configuration ───
// Change this to your FastAPI server IP address
// If running locally: "http://192.168.x.x:8000"
// If deployed: "https://your-domain.com"
const char* SERVER_BASE_URL = "http://192.168.1.100:8000";

// ─── Timing Configuration ───
const unsigned long SENSOR_SEND_INTERVAL  = 30000;  // Send sensor data every 30 seconds
const unsigned long ACTUATOR_POLL_INTERVAL = 5000;   // Poll actuator states every 5 seconds

unsigned long lastSensorSend  = 0;
unsigned long lastActuatorPoll = 0;

// ─── Relay Pin Configuration ───
// Change these to match your actual wiring!
#define RELAY_POMPA_NUTRISI   26
#define RELAY_POMPA_AIR       27
#define RELAY_KIPAS           14
#define RELAY_LAMPU_GROW      12
#define RELAY_SOLENOID_VALVE  13
#define RELAY_MISTING         25

// Set to true if your relay module is active-LOW (most common)
// Active-LOW means: digitalWrite(pin, LOW) = relay ON
const bool RELAY_ACTIVE_LOW = true;

// ─── Sensor Pin Configuration ───
// Adjust these based on your sensor wiring
// #define DHT_PIN           4
// #define BH1750_SDA        21
// #define BH1750_SCL        22
// #define PH_SENSOR_PIN     34  // Analog
// #define TDS_SENSOR_PIN    35  // Analog
// #define DS18B20_PIN       15


// ─── Helper: Set relay state ───
void setRelay(int pin, bool shouldBeOn) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, shouldBeOn ? LOW : HIGH);
  } else {
    digitalWrite(pin, shouldBeOn ? HIGH : LOW);
  }
}


// ─── Read Sensors (replace with your actual sensor code) ───
// Returns a JSON document with all sensor readings
void readSensors(JsonDocument& doc) {
  // ╔══════════════════════════════════════════════════════╗
  // ║  REPLACE THESE WITH YOUR ACTUAL SENSOR READINGS!    ║
  // ║  Below are placeholder values for testing.          ║
  // ╚══════════════════════════════════════════════════════╝
  
  // Example: Greenhouse Temperature (DHT22)
  doc["suhu_rumah_kaca"] = 25.3;    // Replace with: dht.readTemperature();
  
  // Example: Humidity (DHT22)
  doc["kelembapan"] = 72.5;         // Replace with: dht.readHumidity();
  
  // Example: Light Intensity (BH1750)
  doc["intensitas_cahaya"] = 420;   // Replace with: lightMeter.readLightLevel();
  
  // Example: pH Sensor
  doc["ph"] = 6.1;                  // Replace with: readPH(PH_SENSOR_PIN);
  
  // Example: TDS Sensor
  doc["tds"] = 520;                 // Replace with: readTDS(TDS_SENSOR_PIN);
  
  // Example: Solution Temperature (DS18B20)
  doc["suhu_larutan"] = 22.8;       // Replace with: ds18b20.getTempCByIndex(0);
}


// ─── Send Sensor Data to Server ───
void sendSensorData() {
  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sensor-data";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  JsonDocument doc;
  readSensors(doc);
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("[SENSOR] Sending data: ");
  Serial.println(jsonPayload);
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("[SENSOR] Response (");
    Serial.print(httpCode);
    Serial.print("): ");
    Serial.println(response);
  } else {
    Serial.print("[SENSOR] Error: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}


// ─── Poll Actuator States and Control Relays ───
void pollActuatorStates() {
  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/actuator-states";
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
      Serial.print("[ACTUATOR] JSON parse error: ");
      Serial.println(error.c_str());
      http.end();
      return;
    }
    
    JsonArray actuators = doc["actuators"];
    
    Serial.print("[ACTUATOR] Received ");
    Serial.print(actuators.size());
    Serial.println(" actuator states:");
    
    for (JsonObject act : actuators) {
      const char* id = act["id"];
      bool isOn = act["is_on"];
      
      Serial.print("  - ");
      Serial.print(id);
      Serial.print(": ");
      Serial.println(isOn ? "ON" : "OFF");
      
      // Map actuator ID to relay pin
      if (strcmp(id, "pompa_nutrisi") == 0) {
        setRelay(RELAY_POMPA_NUTRISI, isOn);
      }
      else if (strcmp(id, "pompa_air") == 0) {
        setRelay(RELAY_POMPA_AIR, isOn);
      }
      else if (strcmp(id, "kipas") == 0) {
        setRelay(RELAY_KIPAS, isOn);
      }
      else if (strcmp(id, "lampu_grow") == 0) {
        setRelay(RELAY_LAMPU_GROW, isOn);
      }
      else if (strcmp(id, "solenoid_valve") == 0) {
        setRelay(RELAY_SOLENOID_VALVE, isOn);
      }
      else if (strcmp(id, "misting") == 0) {
        setRelay(RELAY_MISTING, isOn);
      }
    }
  } else {
    Serial.print("[ACTUATOR] HTTP Error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}


// ─── Setup ───
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Dashboard Monitoring - ESP32 Controller ===\n");
  
  // Initialize relay pins (all OFF initially)
  int relayPins[] = {
    RELAY_POMPA_NUTRISI, RELAY_POMPA_AIR, RELAY_KIPAS,
    RELAY_LAMPU_GROW, RELAY_SOLENOID_VALVE, RELAY_MISTING
  };
  
  for (int i = 0; i < 6; i++) {
    pinMode(relayPins[i], OUTPUT);
    setRelay(relayPins[i], false);  // Start with all relays OFF
  }
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection FAILED! Will retry in loop.");
  }
  
  Serial.println("\nStarting main loop...");
  Serial.print("  Sensor send interval: ");
  Serial.print(SENSOR_SEND_INTERVAL / 1000);
  Serial.println("s");
  Serial.print("  Actuator poll interval: ");
  Serial.print(ACTUATOR_POLL_INTERVAL / 1000);
  Serial.println("s\n");
}


// ─── Main Loop ───
void loop() {
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    return;
  }
  
  unsigned long now = millis();
  
  // Send sensor data at regular intervals
  if (now - lastSensorSend >= SENSOR_SEND_INTERVAL || lastSensorSend == 0) {
    sendSensorData();
    lastSensorSend = now;
  }
  
  // Poll actuator states more frequently
  if (now - lastActuatorPoll >= ACTUATOR_POLL_INTERVAL || lastActuatorPoll == 0) {
    pollActuatorStates();
    lastActuatorPoll = now;
  }
  
  delay(100);  // Small delay to prevent watchdog issues
}

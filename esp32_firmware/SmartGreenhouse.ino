#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

// ==========================================
// إعدادات الشبكة و Supabase (تم التحديث)
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* supabase_url = "https://wwllnbvwsvsedvjbvszk.supabase.co";
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bGxuYnZ3c3ZzZWR2amJ2c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njk2NDcsImV4cCI6MjA4ODE0NTY0N30.2WP7LwkFEJun2xO9QdGoOwR3yOLDsXZyADFVJJR046s";

// ==========================================
// تعريف أطراف التوصيل (Pins)
// ==========================================
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_MOISTURE_PIN 34
#define WATER_LEVEL_PIN 35

#define RELAY_PUMP 25
#define RELAY_VALVE 26
#define RELAY_FAN 27
#define RELAY_HEATER 14
#define RELAY_LIGHT 12

#define BUZZER_PIN 33

// ==========================================
// إعدادات لوحة المفاتيح (Keypad)
// ==========================================
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {19, 18, 5, 17};
byte colPins[COLS] = {16, 4, 2, 15};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ==========================================
// إعدادات الشاشة (LCD) و الحساسات
// ==========================================
LiquidCrystal_I2C lcd(0x27, 20, 4);
DHT dht(DHTPIN, DHTTYPE);

// ==========================================
// المتغيرات العامة
// ==========================================
float currentTemp = 0.0;
float currentHumidity = 0.0;
float currentSoilMoisture = 0.0;
bool isTankEmpty = false;

bool isAutoMode = true;
bool pumpState = false;
bool valveState = false;
bool fanState = false;
bool heaterState = false;
bool lightState = false;

// إعدادات المحصول النشط (يتم تحديثها من السحابة)
float targetMinTemp = 20.0;
float targetMaxTemp = 30.0;
float targetMinMoisture = 40.0;
float targetMaxMoisture = 80.0;

// توقيتات (Timers)
unsigned long lastSensorRead = 0;
unsigned long lastTelemetrySend = 0;
unsigned long lastCommandCheck = 0;

const unsigned long SENSOR_INTERVAL = 5000; // 5 ثواني
const unsigned long TELEMETRY_INTERVAL = 10000; // 10 ثواني
const unsigned long COMMAND_INTERVAL = 3000; // 3 ثواني

// ==========================================
// الدوال المساعدة
// ==========================================

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void updateLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:"); lcd.print(currentTemp, 1); lcd.print("C H:"); lcd.print(currentHumidity, 1); lcd.print("%");
  lcd.setCursor(0, 1);
  lcd.print("Soil:"); lcd.print(currentSoilMoisture, 1); lcd.print("%");
  lcd.setCursor(0, 2);
  lcd.print("Tank:"); lcd.print(isTankEmpty ? "EMPTY!" : "OK");
  lcd.setCursor(0, 3);
  lcd.print("Mode:"); lcd.print(isAutoMode ? "AUTO" : "MANUAL");
  lcd.print(WiFi.status() == WL_CONNECTED ? " WIFI" : " NO-WIFI");
}

void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    currentTemp = t;
    currentHumidity = h;
  }
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  currentSoilMoisture = map(soilRaw, 4095, 0, 0, 100);
  if(currentSoilMoisture < 0) currentSoilMoisture = 0;
  if(currentSoilMoisture > 100) currentSoilMoisture = 100;
  isTankEmpty = digitalRead(WATER_LEVEL_PIN) == HIGH;
}

void controlRelays() {
  if (isTankEmpty && pumpState) {
    pumpState = false;
    beep(500);
  }
  if (currentTemp > 40.0 && heaterState) {
    heaterState = false;
    beep(500);
  }
  digitalWrite(RELAY_PUMP, pumpState ? LOW : HIGH);
  digitalWrite(RELAY_VALVE, valveState ? LOW : HIGH);
  digitalWrite(RELAY_FAN, fanState ? LOW : HIGH);
  digitalWrite(RELAY_HEATER, heaterState ? LOW : HIGH);
  digitalWrite(RELAY_LIGHT, lightState ? LOW : HIGH);
}

void autoControlLogic() {
  if (!isAutoMode) return;
  if (currentTemp > targetMaxTemp) {
    fanState = true;
    heaterState = false;
  } else if (currentTemp < targetMinTemp) {
    fanState = false;
    heaterState = true;
  } else {
    fanState = false;
    heaterState = false;
  }
  if (currentSoilMoisture < targetMinMoisture && !isTankEmpty) {
    pumpState = true;
    valveState = true;
  } else if (currentSoilMoisture > targetMaxMoisture) {
    pumpState = false;
    valveState = false;
  }
}

// تحديث حالة الأجهزة في السحابة عند التغيير من الكيباد
void updateCloudState() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(supabase_url) + "/rest/v1/device_state";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);
    
    StaticJsonDocument<200> doc;
    doc["system_mode"] = isAutoMode ? "AUTO" : "MANUAL";
    doc["pump_on"] = pumpState;
    doc["valve_on"] = valveState;
    doc["fan_on"] = fanState;
    doc["heater_on"] = heaterState;
    doc["light_on"] = lightState;
    
    String requestBody;
    serializeJson(doc, requestBody);
    http.PATCH(requestBody); // استخدام PATCH لتحديث الصف الموجود
    http.end();
  }
}

void handleKeypad() {
  char key = keypad.getKey();
  if (key) {
    beep(100);
    switch (key) {
      case 'A': isAutoMode = !isAutoMode; break;
      case '1': if (!isAutoMode && !isTankEmpty) pumpState = !pumpState; break;
      case '2': if (!isAutoMode) valveState = !valveState; break;
      case '3': if (!isAutoMode) fanState = !fanState; break;
      case '4': if (!isAutoMode && currentTemp <= 40.0) heaterState = !heaterState; break;
      case '5': if (!isAutoMode) lightState = !lightState; break;
      case 'D': 
        isAutoMode = false; pumpState = false; valveState = false; 
        fanState = false; heaterState = false; lightState = false; 
        beep(1000); break;
    }
    updateLCD();
    controlRelays();
    updateCloudState(); // إرسال التحديث للسحابة فوراً
  }
}

void sendTelemetry() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(supabase_url) + "/rest/v1/telemetry";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    StaticJsonDocument<200> doc;
    doc["temperature"] = currentTemp;
    doc["humidity"] = currentHumidity;
    doc["soil_moisture"] = currentSoilMoisture;
    doc["water_level"] = !isTankEmpty;

    String requestBody;
    serializeJson(doc, requestBody);
    http.POST(requestBody);
    http.end();
  }
}

void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // جلب حالة الأجهزة مع بيانات المحصول النشط في طلب واحد
    String url = String(supabase_url) + "/rest/v1/device_state?select=*,crop_profiles(*)&limit=1";
    http.begin(url);
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
      String payload = http.getString();
      DynamicJsonDocument doc(2048);
      deserializeJson(doc, payload);
      
      if (doc.size() > 0) {
        JsonObject state = doc[0];
        String mode = state["system_mode"];
        isAutoMode = (mode == "AUTO");
        
        if (!isAutoMode) {
          pumpState = state["pump_on"];
          valveState = state["valve_on"];
          fanState = state["fan_on"];
          heaterState = state["heater_on"];
          lightState = state["light_on"];
        }

        // تحديث إعدادات المحصول النشط
        JsonObject crop = state["crop_profiles"];
        if (!crop.isNull()) {
          targetMinTemp = crop["min_temp"];
          targetMaxTemp = crop["max_temp"];
          targetMinMoisture = crop["min_moisture"];
          targetMaxMoisture = crop["max_moisture"];
        }
      }
    }
    http.end();
  }
}

// ==========================================
// الإعداد (Setup)
// ==========================================
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(RELAY_VALVE, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_HEATER, OUTPUT);
  pinMode(RELAY_LIGHT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WATER_LEVEL_PIN, INPUT_PULLUP);

  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(RELAY_VALVE, HIGH);
  digitalWrite(RELAY_FAN, HIGH);
  digitalWrite(RELAY_HEATER, HIGH);
  digitalWrite(RELAY_LIGHT, HIGH);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Greenhouse");

  dht.begin();

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  beep(200); delay(100); beep(200);
  updateLCD();
}

// ==========================================
// الحلقة الرئيسية (Loop)
// ==========================================
void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensors();
    autoControlLogic();
    controlRelays();
    updateLCD();
  }

  handleKeypad();

  if (currentMillis - lastTelemetrySend >= TELEMETRY_INTERVAL) {
    lastTelemetrySend = currentMillis;
    sendTelemetry();
  }

  if (currentMillis - lastCommandCheck >= COMMAND_INTERVAL) {
    lastCommandCheck = currentMillis;
    checkCommands();
    controlRelays();
    updateLCD();
  }
}

# نظام الصوبة الزراعية الذكية (Smart Greenhouse IoT System)

هذا المشروع عبارة عن نظام متكامل لإدارة الصوب الزراعية الذكية، يتكون من نظام تحكم محلي مبني على ESP32، ولوحة تحكم ويب تفاعلية، وقاعدة بيانات سحابية باستخدام Supabase.

## 📁 هيكل المشروع

- `/esp32_firmware/`: يحتوي على كود المصدر الخاص بمتحكم ESP32 (Arduino C++).
- `/supabase/`: يحتوي على ملفات SQL لإنشاء قاعدة البيانات في Supabase.
- `/src/`: يحتوي على كود المصدر الخاص بتطبيق الويب (React + Vite).

## 🔌 مخطط التوصيل (Wiring Diagram)

### 1. الحساسات (Sensors)
- **DHT22 (الحرارة والرطوبة):**
  - VCC -> 3.3V
  - GND -> GND
  - Data -> GPIO 4
- **حساس رطوبة التربة التناظري (Soil Moisture):**
  - VCC -> 3.3V
  - GND -> GND
  - AOUT -> GPIO 34
- **حساس مستوى الماء (Water Level Float Switch):**
  - Pin 1 -> GND
  - Pin 2 -> GPIO 35 (مع تفعيل Pull-up داخلي أو خارجي)

### 2. المشغلات (Actuators - عبر وحدة الريلاي)
- **مضخة الماء (Water Pump):** Relay 1 -> GPIO 25
- **صمام المياه (Solenoid Valve):** Relay 2 -> GPIO 26
- **مروحة التهوية (Ventilation Fan):** Relay 3 -> GPIO 27
- **السخان (Heater):** Relay 4 -> GPIO 14
- **الإضاءة (Lighting):** Relay 5 -> GPIO 12

### 3. واجهة المستخدم (User Interface)
- **شاشة LCD 20x4 (I2C):**
  - VCC -> 5V
  - GND -> GND
  - SDA -> GPIO 21
  - SCL -> GPIO 22
- **لوحة المفاتيح 4x4 (Matrix Keypad):**
  - الصفوف (Rows) -> GPIO 19, 18, 5, 17
  - الأعمدة (Cols) -> GPIO 16, 4, 2, 15
- **الطنان الصوتي (Active Buzzer):**
  - VCC -> GPIO 33
  - GND -> GND

## 🛠️ إعداد البيئة والتشغيل

### 1. إعداد قاعدة البيانات (Supabase)
1. قم بإنشاء مشروع جديد في [Supabase](https://supabase.com/).
2. اذهب إلى قسم SQL Editor وقم بتشغيل الكود الموجود في ملف `/supabase/schema.sql`.
3. احصل على `URL` و `anon key` الخاصين بمشروعك من إعدادات API.

### 2. إعداد تطبيق الويب
1. قم بإنشاء ملف `.env` في الجذر الرئيسي للمشروع وأضف المتغيرات التالية:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. قم بتثبيت الحزم المطلوبة: `npm install`
3. قم بتشغيل خادم التطوير: `npm run dev`

### 3. إعداد ESP32
1. قم بتثبيت بيئة التطوير Arduino IDE أو PlatformIO.
2. قم بتثبيت المكتبات التالية:
   - `DHT sensor library` by Adafruit
   - `LiquidCrystal I2C` by Frank de Brabander
   - `Keypad` by Mark Stanley, Alexander Brevig
   - `ArduinoJson` by Benoit Blanchon
   - `HTTPClient` (مدمجة مع حزمة ESP32)
3. افتح ملف `/esp32_firmware/SmartGreenhouse.ino`.
4. قم بتعديل بيانات شبكة Wi-Fi وبيانات Supabase في بداية الكود.
5. قم برفع الكود إلى لوحة ESP32.

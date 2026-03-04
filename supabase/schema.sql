-- تمكين إضافة uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- حذف الجداول القديمة لإعادة إنشائها بشكل نظيف
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS commands CASCADE;
DROP TABLE IF EXISTS device_state CASCADE;
DROP TABLE IF EXISTS crop_profiles CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;

-- إنشاء جدول إعدادات الإدارة
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    password TEXT NOT NULL
);
INSERT INTO admin_settings (password) VALUES ('admin123');

-- إنشاء جدول التنبيهات (Alerts)
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message_ar TEXT NOT NULL,
    message_en TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);

-- إنشاء جدول التوصيفات الزراعية (Crop Profiles)
CREATE TABLE crop_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    min_temp FLOAT NOT NULL,
    max_temp FLOAT NOT NULL,
    min_moisture FLOAT NOT NULL,
    max_moisture FLOAT NOT NULL,
    irrigation_duration_sec INTEGER NOT NULL,
    image_url TEXT
);

-- إدخال بعض المحاصيل الافتراضية
INSERT INTO crop_profiles (name_ar, name_en, min_temp, max_temp, min_moisture, max_moisture, irrigation_duration_sec, image_url)
VALUES 
('طماطم', 'Tomato', 20.0, 28.0, 60.0, 80.0, 300, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300&h=300'),
('خس', 'Lettuce', 15.0, 22.0, 70.0, 85.0, 200, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=300&h=300');

-- إنشاء جدول حالة الأجهزة (Device State)
CREATE TABLE device_state (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    pump_on BOOLEAN DEFAULT FALSE,
    valve_on BOOLEAN DEFAULT FALSE,
    fan_on BOOLEAN DEFAULT FALSE,
    heater_on BOOLEAN DEFAULT FALSE,
    light_on BOOLEAN DEFAULT FALSE,
    system_mode VARCHAR(20) DEFAULT 'AUTO',
    active_crop_id UUID REFERENCES crop_profiles(id)
);

-- إدخال صف افتراضي لحالة الأجهزة وربطه بأول محصول
INSERT INTO device_state (pump_on, valve_on, fan_on, heater_on, light_on, system_mode, active_crop_id) 
VALUES (FALSE, FALSE, FALSE, FALSE, FALSE, 'AUTO', (SELECT id FROM crop_profiles LIMIT 1));

-- إنشاء جدول القياسات (Telemetry)
CREATE TABLE telemetry (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    soil_moisture FLOAT NOT NULL,
    water_level BOOLEAN NOT NULL
);

-- إدخال بيانات افتراضية للرسوم البيانية (آخر أسبوعين، قراءة كل ساعة)
INSERT INTO telemetry (created_at, temperature, humidity, soil_moisture, water_level)
SELECT 
  NOW() - (i || ' hours')::interval,
  20 + random() * 15, -- Temp between 20 and 35
  40 + random() * 40, -- Humidity between 40 and 80
  30 + random() * 50, -- Soil moisture between 30 and 80
  random() > 0.1      -- Water level mostly true
FROM generate_series(1, 14 * 24) AS i;

-- إنشاء جدول فريق العمل (Team Members)
CREATE TABLE team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    role_ar VARCHAR(100) NOT NULL,
    role_en VARCHAR(100) NOT NULL,
    image_url TEXT
);

-- إعداد سياسات الأمان (RLS)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access to alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to crop_profiles" ON crop_profiles FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to device_state" ON device_state FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to telemetry" ON telemetry FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow public read access to admin_settings" ON admin_settings FOR SELECT USING (true);

-- تفعيل Realtime لجميع الجداول
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table crop_profiles;
alter publication supabase_realtime add table device_state;
alter publication supabase_realtime add table telemetry;
alter publication supabase_realtime add table team_members;

-- إعداد التخزين للصور (Storage)
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict do nothing;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );
create policy "Anon Insert" on storage.objects for insert with check ( bucket_id = 'images' );
create policy "Anon Update" on storage.objects for update using ( bucket_id = 'images' );
create policy "Anon Delete" on storage.objects for delete using ( bucket_id = 'images' );

-- 1. BẬT EXTENSIONS (Trong Supabase Dashboard → Extensions)
-- uuid-ossp, postgis, pgcrypto đã có sẵn
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TẠO TABLES trong public schema
-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'farmer' CHECK (role IN ('admin', 'technician', 'farmer')),
    
    -- Location
    province VARCHAR(50),
    district VARCHAR(50),
    commune VARCHAR(50),
    address TEXT,
    location GEOMETRY(Point, 4326),
    
    -- Preferences
    language VARCHAR(2) DEFAULT 'vi',
    measurement_unit VARCHAR(10) DEFAULT 'metric',
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farms
CREATE TABLE farms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    farm_name VARCHAR(100) NOT NULL,
    farm_code VARCHAR(20) UNIQUE,
    
    -- Farm details
    farm_type VARCHAR(20) NOT NULL CHECK (farm_type IN (
        'shrimp_rice', 'fish_rice', 'rice_only', 
        'shrimp_only', 'fish_only'
    )),
    area_hectares DECIMAL(8,2) NOT NULL,
    
    -- Location
    geometry GEOMETRY(POLYGON, 4326),
    address TEXT,
    
    -- Current status
    current_phase VARCHAR(30) DEFAULT 'planning',
    planting_date DATE,
    expected_harvest_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IoT Devices
CREATE TABLE iot_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
    device_eui VARCHAR(16) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    
    -- Device info
    device_type VARCHAR(30) NOT NULL,
    hardware_version VARCHAR(20),
    firmware_version VARCHAR(20),
    
    -- Status
    battery_level INTEGER,
    last_seen TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor Readings (Time-series)
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID REFERENCES iot_devices(id) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Measurements
    salinity DECIMAL(5,2),
    temperature DECIMAL(4,2),
    ph DECIMAL(3,2),
    water_level DECIMAL(5,2),
    
    -- Metadata
    battery_voltage DECIMAL(4,2),
    signal_strength INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    farm_id UUID REFERENCES farms(id),
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    acknowledged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis Requests
CREATE TABLE analysis_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    farm_id UUID REFERENCES farms(id) NOT NULL,
    
    -- Request details
    analysis_type VARCHAR(30) NOT NULL,
    image_urls TEXT[],
    
    -- Results
    status VARCHAR(20) DEFAULT 'pending',
    results JSONB,
    confidence_score DECIMAL(4,3),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Season Recommendations
CREATE TABLE season_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES farms(id) NOT NULL,
    
    -- Analysis
    current_salinity_avg DECIMAL(5,2),
    salinity_trend VARCHAR(20),
    
    -- Recommendation
    recommended_action VARCHAR(50) NOT NULL,
    explanation TEXT NOT NULL,
    confidence_level VARCHAR(10),
    
    -- Status
    status VARCHAR(20) DEFAULT 'suggested',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Verifications (Added for Auth Service)
CREATE TABLE public.otp_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BẬT RLS cho tất cả tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- POLICIES cho user_profiles
-- Users chỉ xem được profile của chính mình
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users chỉ update được profile của chính mình
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- POLICIES cho farms
-- Users có thể xem farms của mình
CREATE POLICY "Users can view own farms"
    ON farms FOR SELECT
    USING (auth.uid() = user_id);

-- Users có thể tạo farms cho mình
CREATE POLICY "Users can create farms"
    ON farms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users có thể update farms của mình
CREATE POLICY "Users can update own farms"
    ON farms FOR UPDATE
    USING (auth.uid() = user_id);

-- POLICIES cho iot_devices
-- Users có thể xem devices của farms mình
CREATE POLICY "Users can view farm devices"
    ON iot_devices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM farms
            WHERE farms.id = iot_devices.farm_id
            AND farms.user_id = auth.uid()
        )
    );

-- POLICIES cho sensor_readings
-- Users có thể xem sensor data của devices mình
CREATE POLICY "Users can view sensor data"
    ON sensor_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM iot_devices d
            JOIN farms f ON f.id = d.farm_id
            WHERE d.id = sensor_readings.device_id
            AND f.user_id = auth.uid()
        )
    );

-- Cho phép IoT Service insert sensor data (không cần auth)
-- Note: 'anon' role used for simulation if needed, or service_role handles it bypassing RLS
CREATE POLICY "Allow IoT service to insert readings"
    ON sensor_readings FOR INSERT
    WITH CHECK (true);

-- POLICIES cho alerts
-- Users chỉ xem alerts của mình
CREATE POLICY "Users can view own alerts"
    ON alerts FOR SELECT
    USING (auth.uid() = user_id);

-- Service có thể tạo alerts
CREATE POLICY "Allow service to create alerts"
    ON alerts FOR INSERT
    WITH CHECK (true);

-- POLICIES cho otp_verifications
CREATE POLICY "Service Role full access OTP" ON public.otp_verifications
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can insert OTP" ON public.otp_verifications
AS PERMISSIVE FOR INSERT
TO anon
WITH CHECK (true);


-- Tạo storage buckets cho images
-- Note: INSERTs into storage.buckets usually require superuser or direct SQL admin access, may fail in standard migrator if not admin
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES 
--     ('farm-images', 'farm-images', true),
--     ('user-avatars', 'user-avatars', true),
--     ('analysis-images', 'analysis-images', true)
-- ON CONFLICT DO NOTHING;

-- Storage policies
-- CREATE POLICY "Users can upload farm images"
--     ON storage.objects FOR INSERT
--     TO authenticated
--     WITH CHECK (bucket_id = 'farm-images');

-- CREATE POLICY "Users can view farm images"
--     ON storage.objects FOR SELECT
--     TO authenticated
--     USING (bucket_id = 'farm-images');

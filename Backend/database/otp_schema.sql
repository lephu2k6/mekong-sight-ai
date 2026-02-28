-- 9. otp_verifications (Temporary OTP storage)
CREATE TABLE public.otp_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone number to speed up lookups
CREATE INDEX idx_otp_phone ON public.otp_verifications (phone_number);

-- RLS for OTP (Service Role only should access this ideally, but for now allow public insert for login flow if RLS is strict)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
-- Allow anyone to insert (for sending OTP)
CREATE POLICY "Anyone can insert OTP" ON public.otp_verifications FOR INSERT WITH CHECK (true);
-- Allow reading only if you are the owner (difficult without auth) or just Service Role. 
-- For simplicity in this architecture where Auth Service (using Service Role) handles everything:
CREATE POLICY "Service Role full access OTP" ON public.otp_verifications USING (true) WITH CHECK (true);

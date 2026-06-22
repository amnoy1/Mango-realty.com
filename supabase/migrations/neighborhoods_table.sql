-- Run this in Supabase SQL Editor
-- Creates the neighborhoods cache table

CREATE TABLE IF NOT EXISTS neighborhoods (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  city          text        NOT NULL,
  neighborhood  text        NOT NULL DEFAULT '',
  avg_price_sqm integer,
  price_trend   text,
  description   text,
  school_count  integer     DEFAULT 0,
  schools_data  jsonb       DEFAULT '[]',
  image_url     text,
  prices_updated_at    timestamptz,
  analysis_updated_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(city, neighborhood)
);

-- Public read access (buyers can see neighborhood data)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "neighborhoods_public_read" ON neighborhoods
  FOR SELECT USING (true);

-- Only service_role can write (our server)
-- (service_role bypasses RLS automatically — no extra policy needed)

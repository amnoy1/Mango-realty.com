-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agents (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug       TEXT        UNIQUE NOT NULL,
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  phone      TEXT,
  email      TEXT,
  photo_url  TEXT,
  bio        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read agents"
  ON agents FOR SELECT USING (true);

CREATE POLICY "service role full access agents"
  ON agents USING (auth.role() = 'service_role');

-- Add agent link to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

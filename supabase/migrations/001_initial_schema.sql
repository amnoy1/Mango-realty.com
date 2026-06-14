-- ================================================
-- Mango Realty — Initial Schema
-- ================================================

-- Enable pgvector for AI semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================
-- PROPERTIES
-- ================================================
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           BIGINT,
  price_type      TEXT DEFAULT 'sale'      CHECK (price_type IN ('sale','rent')),
  property_type   TEXT DEFAULT 'apartment' CHECK (property_type IN ('apartment','house','commercial','land')),
  status          TEXT DEFAULT 'active'    CHECK (status IN ('active','sold','rented','draft')),
  rooms           DECIMAL(3,1),
  bathrooms       INTEGER,
  area_sqm        DECIMAL(8,1),
  floor           INTEGER,
  total_floors    INTEGER,
  city            TEXT,
  neighborhood    TEXT,
  street          TEXT,
  lat             DECIMAL(9,6),
  lng             DECIMAL(9,6),
  features        JSONB    DEFAULT '{}',
  images          TEXT[]   DEFAULT '{}',
  documents       JSONB    DEFAULT '{}',
  embedding       vector(1536),
  meta_title      TEXT,
  meta_description TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

-- ================================================
-- NEIGHBORHOODS
-- ================================================
CREATE TABLE neighborhoods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  city              TEXT NOT NULL,
  description       TEXT,
  ai_analysis       TEXT,
  avg_price_sqm     INTEGER,
  price_trend       JSONB DEFAULT '{}',
  schools           JSONB DEFAULT '{}',
  transport         JSONB DEFAULT '{}',
  development_plans TEXT,
  images            TEXT[] DEFAULT '{}',
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- USER PROFILES (Buyers — extends auth.users)
-- ================================================
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  preferences JSONB DEFAULT '{}',
  stage       TEXT DEFAULT 'browsing' CHECK (stage IN ('browsing','active','close_to_deal')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- AGENT SESSIONS (AI conversation history)
-- ================================================
CREATE TABLE agent_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  messages         JSONB   DEFAULT '[]',
  properties_shown TEXT[]  DEFAULT '{}',
  favorites        TEXT[]  DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ALERTS (proactive WhatsApp notifications)
-- ================================================
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  search_criteria JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  last_triggered  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- LEADS (CRM → Airtable sync)
-- ================================================
CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  name              TEXT,
  phone             TEXT,
  email             TEXT,
  budget_min        BIGINT,
  budget_max        BIGINT,
  rooms             INTEGER,
  cities            TEXT[] DEFAULT '{}',
  property_type     TEXT,
  timeline          TEXT,
  ai_summary        TEXT,
  status            TEXT DEFAULT 'new' CHECK (status IN ('new','qualified','active','closed')),
  source            TEXT DEFAULT 'ai_agent' CHECK (source IN ('ai_agent','form','call')),
  airtable_record_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_properties_city       ON properties(city);
CREATE INDEX idx_properties_status     ON properties(status);
CREATE INDEX idx_properties_type       ON properties(property_type);
CREATE INDEX idx_properties_price      ON properties(price);
CREATE INDEX idx_properties_embedding  ON properties USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_agent_sessions_user   ON agent_sessions(user_id);
CREATE INDEX idx_alerts_user           ON alerts(user_id, is_active);
CREATE INDEX idx_leads_status          ON leads(status);

-- ================================================
-- AUTO updated_at TRIGGER
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_neighborhoods_updated_at
  BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- AUTO-CREATE user_profile on Google signup
-- ================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE properties     ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;

-- Properties: כולם קוראים (חוץ מdraft), service_role כותב
CREATE POLICY "properties_public_read"   ON properties FOR SELECT USING (status != 'draft');
CREATE POLICY "properties_service_write" ON properties FOR ALL    USING (auth.role() = 'service_role');

-- Neighborhoods: ציבורי לקריאה
CREATE POLICY "neighborhoods_public_read"   ON neighborhoods FOR SELECT USING (true);
CREATE POLICY "neighborhoods_service_write" ON neighborhoods FOR ALL    USING (auth.role() = 'service_role');

-- User profiles: משתמש רואה ומעדכן רק את שלו
CREATE POLICY "profiles_own_read"   ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_service"    ON user_profiles FOR ALL    USING (auth.role() = 'service_role');

-- Agent sessions: משתמש רואה רק שלו
CREATE POLICY "sessions_own_read" ON agent_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_service"  ON agent_sessions FOR ALL    USING (auth.role() = 'service_role');

-- Alerts: משתמש מנהל רק שלו
CREATE POLICY "alerts_own"    ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "alerts_service" ON alerts FOR ALL USING (auth.role() = 'service_role');

-- Leads: רק service_role (Admin + AI agent)
CREATE POLICY "leads_service" ON leads FOR ALL USING (auth.role() = 'service_role');

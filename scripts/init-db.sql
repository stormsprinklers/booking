-- Run this in Neon SQL Editor or via psql to create tables for Housecall Pro sync

CREATE TABLE IF NOT EXISTS hcp_employees (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  service_zone_ids JSONB DEFAULT '[]',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hcp_service_zones (
  id TEXT PRIMARY KEY,
  name TEXT,
  zip_codes JSONB DEFAULT '[]',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hcp_customers (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address_line_1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (captured from pricing results, sent to GHL when abandoned)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  service_category TEXT NOT NULL,
  service_title TEXT,
  pricing_inputs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  hcp_job_id TEXT,
  sent_to_ghl_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_converted_at_idx ON leads (converted_at) WHERE converted_at IS NULL;

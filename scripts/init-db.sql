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

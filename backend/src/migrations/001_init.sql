-- Initial schema for IP-based License Authentication Platform

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  name TEXT,
  license_key TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

-- Allowed IPs table
CREATE TABLE IF NOT EXISTS allowed_ips (
  id SERIAL PRIMARY KEY,
  license_id INTEGER NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  ip_cidr TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Authentication logs table
CREATE TABLE IF NOT EXISTS auth_logs (
  id SERIAL PRIMARY KEY,
  license_key TEXT,
  request_ip TEXT,
  machine_identifier TEXT,
  result TEXT,
  raw_request JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allowed_ips_license ON allowed_ips(license_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);

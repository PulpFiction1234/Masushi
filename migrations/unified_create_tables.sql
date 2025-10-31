-- Unified migration: create all necessary tables for MasushiApp
-- Apply carefully on staging before production. These statements were generated from code usage
-- and optimized for compact storage (UUID for users, jsonb for flexible fields, smallint for enums).

-- 1) profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 2) addresses
CREATE TABLE IF NOT EXISTS addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label VARCHAR(64),
  address_text TEXT NOT NULL,
  coords JSONB, -- { lat: number, lng: number } or null
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- 3) favorites
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_code VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_code)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- 4) orders
-- items stored in jsonb for flexibility and compactness
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  delivery_type SMALLINT NOT NULL, -- 0 = retiro, 1 = delivery
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);

-- 5) admin_state
CREATE TABLE IF NOT EXISTS admin_state (
  id INT PRIMARY KEY,
  force_closed BOOLEAN NOT NULL DEFAULT FALSE,
  force_closed_ymd DATE,
  force_closed_at TIMESTAMPTZ,
  force_open BOOLEAN NOT NULL DEFAULT FALSE,
  force_open_at TIMESTAMPTZ
);

-- 6) schedule_overrides
CREATE TABLE IF NOT EXISTS schedule_overrides (
  ymd DATE PRIMARY KEY,
  intervals JSONB, -- null = closed; otherwise array of { from: 'HH:MM', to: 'HH:MM' }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) product_overrides
CREATE TABLE IF NOT EXISTS product_overrides (
  codigo TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_overrides_enabled ON product_overrides(enabled);

-- Optional: add any helpful extension enabling (uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- useful for text similarity searches

-- End of unified migration

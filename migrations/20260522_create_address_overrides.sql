-- Tabla de overrides de direcciones para delivery
-- Permite agregar manualmente direcciones que Mapbox no tiene actualizadas
-- sin necesidad de redeploy.

CREATE TABLE IF NOT EXISTS address_overrides (
  id         BIGSERIAL PRIMARY KEY,
  display_label TEXT NOT NULL,           -- "Av. Paseo Pie Andino 3286, Puente Alto"
  lng        DOUBLE PRECISION NOT NULL,  -- longitud (ej: -70.53602)
  lat        DOUBLE PRECISION NOT NULL,  -- latitud  (ej: -33.57762)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE address_overrides ENABLE ROW LEVEL SECURITY;

-- Lectura pública (AddressSearch la necesita sin autenticación)
CREATE POLICY "address_overrides_public_read"
  ON address_overrides FOR SELECT
  USING (true);

-- Solo service_role puede insertar/eliminar (via API admin con service key)
-- No se necesita política para INSERT/DELETE porque el service_role bypasea RLS.

-- Migration: Add force_open_ymd column and create reset function for admin_state
-- Esta migración resuelve el problema de resetear el estado forzado a medianoche (hora Chile)

-- 1. Agregar columna force_open_ymd si no existe
ALTER TABLE admin_state ADD COLUMN IF NOT EXISTS force_open_ymd DATE;

-- 2. Crear función RPC para resetear el estado si es un nuevo día
-- Esta función se llama automáticamente cuando se consulta el estado del admin
-- y reseteará los estados forzados si fueron configurados en un día anterior
CREATE OR REPLACE FUNCTION public.reset_admin_state_if_new_day()
RETURNS void AS $$
DECLARE
  current_ymd DATE;
  state_row RECORD;
BEGIN
  -- Obtener la fecha actual en zona horaria de Chile
  current_ymd := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::DATE;
  
  -- Obtener el estado actual
  SELECT * INTO state_row FROM admin_state WHERE id = 1;
  
  -- Si no existe el registro, no hay nada que resetear
  IF state_row IS NULL THEN
    RETURN;
  END IF;
  
  -- Si force_closed está activo y fue configurado en un día anterior, resetear
  IF state_row.force_closed = TRUE AND state_row.force_closed_ymd IS NOT NULL THEN
    IF state_row.force_closed_ymd < current_ymd THEN
      UPDATE admin_state 
      SET 
        force_closed = FALSE,
        force_closed_ymd = NULL,
        force_closed_at = NULL
      WHERE id = 1;
      RAISE NOTICE '[admin_state] Reseteado force_closed (era del %, hoy es %)', state_row.force_closed_ymd, current_ymd;
    END IF;
  END IF;
  
  -- Si force_open está activo y fue configurado en un día anterior, resetear
  IF state_row.force_open = TRUE AND state_row.force_open_ymd IS NOT NULL THEN
    IF state_row.force_open_ymd < current_ymd THEN
      UPDATE admin_state 
      SET 
        force_open = FALSE,
        force_open_at = NULL,
        force_open_ymd = NULL
      WHERE id = 1;
      RAISE NOTICE '[admin_state] Reseteado force_open (era del %, hoy es %)', state_row.force_open_ymd, current_ymd;
    END IF;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Insertar registro inicial si no existe
INSERT INTO admin_state (id, force_closed, force_open)
VALUES (1, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Comentario: Para ejecutar esta migración, copia el contenido y ejecútalo
-- en el SQL Editor de Supabase.

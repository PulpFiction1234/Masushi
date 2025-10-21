-- ============================================
-- MIGRACIÓN: Agregar campo address a profiles
-- ============================================
-- Ejecutar SOLO si ya tenías la tabla profiles creada sin el campo address
-- Si es una instalación nueva, usa supabase-schema.sql completo

-- Agregar columna address (opcional) a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Crear índice para búsquedas por dirección (opcional, útil si necesitas buscar por ubicación)
-- CREATE INDEX IF NOT EXISTS idx_profiles_address ON public.profiles(address);

-- Nota: No es necesario modificar las políticas RLS ya que la columna es opcional
-- y los usuarios ya tienen permisos para actualizar sus propios perfiles

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verifica que la columna se agregó correctamente:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'address';

-- Resultado esperado:
-- column_name | data_type | is_nullable
-- address     | text      | YES

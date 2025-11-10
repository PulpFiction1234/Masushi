-- ============================================
-- ACTUALIZAR NOMBRES COMPLETOS EN PROFILES
-- ============================================
-- Este script actualiza el campo full_name para que contenga
-- nombre + apellido_paterno + apellido_materno
-- 
-- INSTRUCCIONES:
-- 1. Copia este script
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega y ejecuta
-- ============================================

-- Primero, ver cuántos usuarios necesitan actualización
SELECT 
  COUNT(*) as usuarios_a_actualizar
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE 
  (p.apellido_paterno IS NOT NULL AND p.apellido_paterno != '')
  OR (p.apellido_materno IS NOT NULL AND p.apellido_materno != '');

-- Ver ejemplos de cómo quedarían los nombres (sin actualizar aún)
SELECT 
  u.email,
  p.full_name as nombre_actual,
  CONCAT_WS(' ', 
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), p.full_name),
    NULLIF(p.apellido_paterno, ''),
    NULLIF(p.apellido_materno, '')
  ) as nombre_nuevo
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE 
  (p.apellido_paterno IS NOT NULL AND p.apellido_paterno != '')
  OR (p.apellido_materno IS NOT NULL AND p.apellido_materno != '')
LIMIT 10;

-- EJECUTAR SOLO SI ESTÁS SEGURO: Actualizar full_name con nombre completo
UPDATE public.profiles p
SET 
  full_name = CONCAT_WS(' ', 
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), p.full_name),
    NULLIF(p.apellido_paterno, ''),
    NULLIF(p.apellido_materno, '')
  ),
  updated_at = NOW()
FROM auth.users u
WHERE 
  p.id = u.id
  AND (
    (p.apellido_paterno IS NOT NULL AND p.apellido_paterno != '')
    OR (p.apellido_materno IS NOT NULL AND p.apellido_materno != '')
  );

-- Verificar resultado
SELECT 
  u.email,
  p.full_name as nombre_completo,
  p.apellido_paterno,
  p.apellido_materno
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
ORDER BY p.updated_at DESC
LIMIT 20;

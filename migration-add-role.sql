-- ============================================
-- MIGRATION: Agregar campo 'role' a profiles
-- ============================================
-- Ejecutar en el SQL Editor de Supabase si ya tienes la tabla profiles creada

-- Agregar columna role si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Actualizar usuarios existentes para que tengan rol 'user'
UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL;

-- ============================================
-- CÓMO HACER A UN USUARIO ADMIN:
-- ============================================
-- Ejecuta esta query reemplazando el email del usuario:
/*
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);
*/

-- Para ver todos los usuarios y sus roles:
/*
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY p.created_at DESC;
*/

-- ============================================
-- VERIFICAR USUARIOS ADMINISTRADORES
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Copia este script
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega y ejecuta
-- ============================================

-- Ver todos los usuarios con rol admin
SELECT 
  u.id,
  u.email,
  u.created_at as fecha_registro,
  p.full_name as nombre_completo,
  p.role as rol,
  p.created_at as perfil_creado,
  p.updated_at as perfil_actualizado
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY u.email;

-- Contar total de admins
SELECT 
  COUNT(*) as total_admins
FROM public.profiles
WHERE role = 'admin';

-- Ver TODOS los usuarios con sus roles (para comparar)
SELECT 
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY p.role DESC, u.email;

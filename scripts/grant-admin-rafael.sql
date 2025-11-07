-- ============================================
-- OTORGAR ROL DE ADMINISTRADOR
-- ============================================
-- Usuario: benguriadonosorafael@gmail.com
-- 
-- INSTRUCCIONES:
-- 1. Copia este script
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega y ejecuta
-- ============================================

-- Actualizar el rol del usuario a 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'benguriadonosorafael@gmail.com'
);

-- Verificar que se actualizó correctamente
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'benguriadonosorafael@gmail.com';

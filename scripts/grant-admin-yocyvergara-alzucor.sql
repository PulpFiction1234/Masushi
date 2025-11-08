-- ============================================
-- OTORGAR ROL DE ADMINISTRADOR
-- ============================================
-- Usuarios: yocyvergara@gmail.com y alzucor@gmail.com
-- 
-- INSTRUCCIONES:
-- 1. Copia este script
-- 2. Ve a Supabase Dashboard → SQL Editor
-- 3. Pega y ejecuta
-- ============================================

-- Actualizar el rol de yocyvergara@gmail.com a 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'yocyvergara@gmail.com'
);

-- Actualizar el rol de alzucor@gmail.com a 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'alzucor@gmail.com'
);

-- Verificar que se actualizaron correctamente
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('yocyvergara@gmail.com', 'alzucor@gmail.com')
ORDER BY u.email;

-- ============================================
-- SCRIPT PARA GESTIONAR USUARIOS EN SUPABASE
-- ============================================
-- Este script te permite ver y eliminar usuarios de forma segura
-- IMPORTANTE: Ejecuta cada sección por separado en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- OPCIÓN 1: VER TODOS LOS USUARIOS
-- ============================================
-- Lista todos los usuarios con su información básica
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.phone,
  p.role,
  (SELECT COUNT(*) FROM public.orders WHERE user_id = u.id) as total_orders,
  (SELECT COUNT(*) FROM public.favorites WHERE user_id = u.id) as total_favorites
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;


-- ============================================
-- OPCIÓN 2: BUSCAR USUARIO POR EMAIL
-- ============================================
-- Reemplaza 'email@ejemplo.com' con el email que buscas
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.phone,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email ILIKE '%email@ejemplo.com%';


-- ============================================
-- OPCIÓN 3: VER DETALLES DE UN USUARIO ESPECÍFICO
-- ============================================
-- Reemplaza el UUID con el ID del usuario
DO $$
DECLARE
  v_uid uuid := 'REEMPLAZAR-CON-UUID-DEL-USUARIO';
  v_email text;
  v_name text;
  v_orders_count int;
  v_favorites_count int;
  v_discount_codes_count int;
BEGIN
  -- Obtener info del usuario
  SELECT u.email, p.full_name 
  INTO v_email, v_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = v_uid;
  
  -- Contar datos relacionados
  SELECT count(*) INTO v_orders_count FROM public.orders WHERE user_id = v_uid;
  SELECT count(*) INTO v_favorites_count FROM public.favorites WHERE user_id = v_uid;
  SELECT count(*) INTO v_discount_codes_count FROM public.discount_codes WHERE user_id = v_uid;
  
  -- Mostrar resultados
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INFORMACIÓN DEL USUARIO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UID: %', v_uid;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Nombre: %', v_name;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Pedidos: %', v_orders_count;
  RAISE NOTICE 'Favoritos: %', v_favorites_count;
  RAISE NOTICE 'Códigos descuento: %', v_discount_codes_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- OPCIÓN 4: ELIMINAR UN USUARIO POR UUID
-- ============================================
-- ⚠️ ADVERTENCIA: Esta acción es PERMANENTE
-- Reemplaza el UUID con el ID del usuario a eliminar
-- Las tablas relacionadas se eliminarán automáticamente (CASCADE)

DO $$
DECLARE
  v_uid uuid := 'REEMPLAZAR-CON-UUID-DEL-USUARIO';
  v_email text;
BEGIN
  -- Obtener email antes de eliminar
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  
  -- Eliminar usuario de auth.users (CASCADE eliminará profiles, orders, favorites, discount_codes)
  DELETE FROM auth.users WHERE id = v_uid;
  
  RAISE NOTICE '✓ Usuario eliminado: % (UID: %)', v_email, v_uid;
END $$;


-- ============================================
-- OPCIÓN 5: ELIMINAR USUARIO POR EMAIL
-- ============================================
-- ⚠️ ADVERTENCIA: Esta acción es PERMANENTE
-- Reemplaza 'email@ejemplo.com' con el email del usuario

DO $$
DECLARE
  v_email text := 'email@ejemplo.com';
  v_uid uuid;
  v_deleted_count int := 0;
BEGIN
  -- Buscar y eliminar usuarios con ese email
  FOR v_uid IN 
    SELECT id FROM auth.users WHERE email = v_email
  LOOP
    DELETE FROM auth.users WHERE id = v_uid;
    v_deleted_count := v_deleted_count + 1;
    RAISE NOTICE '✓ Usuario eliminado: % (UID: %)', v_email, v_uid;
  END LOOP;
  
  IF v_deleted_count = 0 THEN
    RAISE NOTICE '⚠ No se encontró ningún usuario con el email: %', v_email;
  END IF;
END $$;


-- ============================================
-- OPCIÓN 6: ELIMINAR USUARIOS DE PRUEBA
-- ============================================
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los usuarios que cumplan los criterios
-- Elimina usuarios con emails de prueba (test, ejemplo, demo, etc.)

DO $$
DECLARE
  v_uid uuid;
  v_email text;
  v_deleted_count int := 0;
BEGIN
  -- Buscar usuarios de prueba
  FOR v_uid, v_email IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email ILIKE '%test%' 
       OR email ILIKE '%ejemplo%'
       OR email ILIKE '%demo%'
       OR email ILIKE '%prueba%'
  LOOP
    DELETE FROM auth.users WHERE id = v_uid;
    v_deleted_count := v_deleted_count + 1;
    RAISE NOTICE '✓ Usuario de prueba eliminado: % (UID: %)', v_email, v_uid;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuarios eliminados: %', v_deleted_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- OPCIÓN 7: ELIMINAR USUARIOS SIN PEDIDOS
-- ============================================
-- ⚠️ ADVERTENCIA: Elimina usuarios que nunca han hecho pedidos
-- Útil para limpiar registros de usuarios que solo se registraron pero no compraron

DO $$
DECLARE
  v_uid uuid;
  v_email text;
  v_deleted_count int := 0;
BEGIN
  -- Buscar usuarios sin pedidos (excepto admins)
  FOR v_uid, v_email IN 
    SELECT u.id, u.email 
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    LEFT JOIN public.orders o ON u.id = o.user_id
    WHERE o.id IS NULL
      AND (p.role IS NULL OR p.role != 'admin')
  LOOP
    DELETE FROM auth.users WHERE id = v_uid;
    v_deleted_count := v_deleted_count + 1;
    RAISE NOTICE '✓ Usuario sin pedidos eliminado: % (UID: %)', v_email, v_uid;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuarios eliminados: %', v_deleted_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- OPCIÓN 8: ELIMINAR USUARIOS CREADOS HOY
-- ============================================
-- ⚠️ ADVERTENCIA: Elimina usuarios creados hoy (útil para pruebas)

DO $$
DECLARE
  v_uid uuid;
  v_email text;
  v_deleted_count int := 0;
BEGIN
  FOR v_uid, v_email IN 
    SELECT id, email 
    FROM auth.users 
    WHERE created_at::date = CURRENT_DATE
  LOOP
    DELETE FROM auth.users WHERE id = v_uid;
    v_deleted_count := v_deleted_count + 1;
    RAISE NOTICE '✓ Usuario eliminado: % (UID: %)', v_email, v_uid;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuarios eliminados: %', v_deleted_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- OPCIÓN 9: VERIFICACIÓN POST-ELIMINACIÓN
-- ============================================
-- Verifica que los datos se eliminaron correctamente
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COUNT(*) FROM public.favorites) as total_favorites,
  (SELECT COUNT(*) FROM public.discount_codes) as total_discount_codes;

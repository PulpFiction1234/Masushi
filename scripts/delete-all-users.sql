-- ============================================
-- ELIMINAR TODOS LOS USUARIOS Y SU INFORMACIÓN
-- ============================================
-- ⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️
-- Este script eliminará TODOS los usuarios de tu sistema
-- Esta acción es PERMANENTE y NO SE PUEDE DESHACER
-- 
-- RECOMENDACIÓN: Haz un backup antes de ejecutar
-- ============================================

-- ============================================
-- PASO 1: VER CUÁNTOS USUARIOS TIENES
-- ============================================
-- Ejecuta esto primero para saber qué vas a eliminar

SELECT 
  'USUARIOS TOTALES' as tipo,
  COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
  'PROFILES',
  COUNT(*)
FROM public.profiles
UNION ALL
SELECT 
  'PEDIDOS',
  COUNT(*)
FROM public.orders
UNION ALL
SELECT 
  'FAVORITOS',
  COUNT(*)
FROM public.favorites
UNION ALL
SELECT 
  'CÓDIGOS DESCUENTO',
  COUNT(*)
FROM public.discount_codes;


-- ============================================
-- PASO 2: VER LISTA DE USUARIOS
-- ============================================
-- Para que veas exactamente quiénes se eliminarán

SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  (SELECT COUNT(*) FROM public.orders WHERE user_id = u.id) as pedidos
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;


-- ============================================
-- PASO 3: ELIMINAR TODOS LOS USUARIOS (EXCEPTO ADMINS)
-- ============================================
-- ⚠️ Esta opción ELIMINA TODOS los usuarios normales
-- PERO PROTEGE a los administradores

DO $$
DECLARE
  v_uid uuid;
  v_email text;
  v_role text;
  v_deleted_count int := 0;
  v_protected_count int := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️ INICIANDO ELIMINACIÓN DE USUARIOS';
  RAISE NOTICE '========================================';
  
  -- Recorrer todos los usuarios
  FOR v_uid, v_email, v_role IN 
    SELECT u.id, u.email, COALESCE(p.role, 'user') as role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
  LOOP
    -- Proteger admins
    IF v_role = 'admin' THEN
      v_protected_count := v_protected_count + 1;
      RAISE NOTICE '🛡️ Admin protegido: %', v_email;
    ELSE
      -- Eliminar usuario normal
      DELETE FROM auth.users WHERE id = v_uid;
      v_deleted_count := v_deleted_count + 1;
      RAISE NOTICE '✓ Usuario eliminado: %', v_email;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PROCESO COMPLETADO';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '🗑️ Usuarios eliminados: %', v_deleted_count;
  RAISE NOTICE '🛡️ Admins protegidos: %', v_protected_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- PASO 4 (ALTERNATIVA): ELIMINAR TODO SIN PROTECCIÓN
-- ============================================
-- ⚠️⚠️⚠️ EXTREMADAMENTE PELIGROSO ⚠️⚠️⚠️
-- Esta opción elimina TODOS los usuarios, incluyendo admins
-- USA SOLO SI ESTÁS 100% SEGURO

-- DESCOMENTA LAS SIGUIENTES LÍNEAS SOLO SI QUIERES ELIMINAR TODO:
/*
DO $$
DECLARE
  v_uid uuid;
  v_email text;
  v_deleted_count int := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️ ELIMINANDO TODOS LOS USUARIOS (INCLUYENDO ADMINS)';
  RAISE NOTICE '========================================';
  
  FOR v_uid, v_email IN 
    SELECT id, email FROM auth.users
  LOOP
    DELETE FROM auth.users WHERE id = v_uid;
    v_deleted_count := v_deleted_count + 1;
    RAISE NOTICE '✓ Usuario eliminado: %', v_email;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Total eliminados: %', v_deleted_count;
  RAISE NOTICE '========================================';
END $$;
*/


-- ============================================
-- PASO 5: VERIFICAR QUE TODO SE ELIMINÓ
-- ============================================
-- Ejecuta esto después de la eliminación

SELECT 
  'USUARIOS RESTANTES' as tipo,
  COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
  'PROFILES',
  COUNT(*)
FROM public.profiles
UNION ALL
SELECT 
  'PEDIDOS',
  COUNT(*)
FROM public.orders
UNION ALL
SELECT 
  'FAVORITOS',
  COUNT(*)
FROM public.favorites
UNION ALL
SELECT 
  'CÓDIGOS DESCUENTO',
  COUNT(*)
FROM public.discount_codes;


-- ============================================
-- PASO 6 (OPCIONAL): LIMPIAR DATOS HUÉRFANOS
-- ============================================
-- Por si acaso quedó algo sin eliminar
-- Esto no debería ser necesario gracias al CASCADE

-- Limpiar profiles huérfanos
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Limpiar orders huérfanas
DELETE FROM public.orders 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Limpiar favorites huérfanos
DELETE FROM public.favorites 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Limpiar códigos de descuento huérfanos
DELETE FROM public.discount_codes 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Verificar limpieza
SELECT 'Limpieza completada' as mensaje;


-- ============================================
-- PASO 7 (OPCIONAL): RESETEAR SECUENCIAS
-- ============================================
-- Reinicia los contadores de IDs auto-incrementales
-- Útil si quieres empezar desde cero

ALTER SEQUENCE public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE public.favorites_id_seq RESTART WITH 1;
ALTER SEQUENCE public.discount_codes_id_seq RESTART WITH 1;

SELECT 'Secuencias reseteadas' as mensaje;

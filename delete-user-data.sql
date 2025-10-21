-- ============================================
-- SQL PARA ELIMINAR USUARIO Y DATOS RELACIONADOS
-- ============================================
-- Usuario: rafaelalbertobenguria@gmail.com
-- UID: c1ae67c7-097f-428f-a1cc-cb88121727e7
--
-- INSTRUCCIONES:
-- 1. Copia y pega este script en Supabase SQL Editor
-- 2. Revisa los conteos primero (sección de verificación)
-- 3. Ejecuta el bloque de eliminación
-- 4. Verifica que todo se eliminó correctamente
-- ============================================

-- ============================================
-- PASO 1: VERIFICAR CONTEOS ANTES DE BORRAR
-- ============================================
-- Ejecuta esto primero para ver cuántas filas hay

DO $$
DECLARE
  v_uid uuid := 'c1ae67c7-097f-428f-a1cc-cb88121727e7';
  v_orders_count int;
  v_favorites_count int;
  v_profiles_count int;
  v_auth_users_count int;
BEGIN
  -- Contar orders
  SELECT count(*) INTO v_orders_count
  FROM public.orders WHERE user_id = v_uid;
  
  -- Contar favorites
  SELECT count(*) INTO v_favorites_count
  FROM public.favorites WHERE user_id = v_uid;
  
  -- Contar profile
  SELECT count(*) INTO v_profiles_count
  FROM public.profiles WHERE id = v_uid;
  
  -- Contar en auth.users
  SELECT count(*) INTO v_auth_users_count
  FROM auth.users WHERE id = v_uid;
  
  -- Mostrar resultados
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONTEO DE FILAS PARA USUARIO:';
  RAISE NOTICE 'UID: %', v_uid;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'orders: %', v_orders_count;
  RAISE NOTICE 'favorites: %', v_favorites_count;
  RAISE NOTICE 'profiles: %', v_profiles_count;
  RAISE NOTICE 'auth.users: %', v_auth_users_count;
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- PASO 2: ELIMINAR DATOS DEL USUARIO
-- ============================================
-- Ejecuta esto después de verificar los conteos

BEGIN;

-- 1) Borrar pedidos del usuario
DELETE FROM public.orders
WHERE user_id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7';

-- 2) Borrar favoritos
DELETE FROM public.favorites
WHERE user_id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7';

-- 3) Borrar perfil
DELETE FROM public.profiles
WHERE id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7';

-- 4) Borrar de auth.users
-- NOTA: Esto puede fallar si no tienes permisos suficientes
-- En ese caso, usa la UI de Supabase (Authentication → Users → Delete)
DELETE FROM auth.users
WHERE id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7';

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USUARIO ELIMINADO EXITOSAMENTE';
  RAISE NOTICE 'UID: c1ae67c7-097f-428f-a1cc-cb88121727e7';
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- PASO 3: VERIFICAR QUE TODO SE ELIMINÓ
-- ============================================
-- Ejecuta esto para confirmar que todo está limpio

SELECT 
  'auth.users' as tabla, 
  count(*) as filas_restantes 
FROM auth.users 
WHERE id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7'

UNION ALL

SELECT 
  'profiles', 
  count(*) 
FROM public.profiles 
WHERE id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7'

UNION ALL

SELECT 
  'orders', 
  count(*) 
FROM public.orders 
WHERE user_id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7'

UNION ALL

SELECT 
  'favorites', 
  count(*) 
FROM public.favorites 
WHERE user_id = 'c1ae67c7-097f-428f-a1cc-cb88121727e7';

-- Todas las cuentas deberían ser 0


-- ============================================
-- ALTERNATIVA: BORRAR TODOS LOS USUARIOS
-- ============================================
-- ⚠️ CUIDADO: Esto borra TODOS los datos de TODOS los usuarios
-- Solo usa esto si quieres empezar completamente de cero

/*
BEGIN;

DELETE FROM public.orders;
DELETE FROM public.favorites;
DELETE FROM public.profiles;
DELETE FROM auth.users;

COMMIT;

RAISE NOTICE '⚠️ TODOS LOS USUARIOS HAN SIDO ELIMINADOS';
*/

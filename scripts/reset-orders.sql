-- ============================================
-- ELIMINAR TODOS LOS PEDIDOS Y REINICIAR CONTADOR
-- ============================================
-- ⚠️ ADVERTENCIA: Esta acción es PERMANENTE
-- Esto eliminará TODOS los pedidos del historial
-- ============================================

-- PASO 1: Ver cuántos pedidos hay actualmente
SELECT 
  'Total de pedidos' as descripcion,
  COUNT(*) as cantidad
FROM public.orders;

-- PASO 2: Ver últimos 5 pedidos (para verificar antes de borrar)
SELECT 
  id,
  user_id,
  total,
  delivery_type,
  created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- PASO 3: ELIMINAR TODOS LOS PEDIDOS
-- ============================================
-- ⚠️ Descomenta las siguientes líneas para ejecutar

/*
DELETE FROM public.orders;
*/

-- ============================================
-- PASO 4: REINICIAR EL CONTADOR DE ID A 1
-- ============================================
-- Esto hará que el próximo pedido sea #1

/*
ALTER SEQUENCE public.orders_id_seq RESTART WITH 1;
*/

-- ============================================
-- PASO 5: VERIFICAR QUE TODO SE ELIMINÓ
-- ============================================

/*
SELECT 
  'Pedidos restantes' as descripcion,
  COUNT(*) as cantidad
FROM public.orders;

SELECT 
  'Próximo ID de pedido' as descripcion,
  nextval('public.orders_id_seq') as proximo_id;
*/

-- ============================================
-- EJECUCIÓN SEGURA (TODO EN UNO)
-- ============================================
-- Si estás 100% seguro, descomenta todo el bloque siguiente:

/*
BEGIN;

-- Eliminar todos los pedidos
DELETE FROM public.orders;

-- Reiniciar el contador
ALTER SEQUENCE public.orders_id_seq RESTART WITH 1;

-- Verificar
SELECT 'Pedidos eliminados correctamente' as mensaje;
SELECT 'Contador reiniciado a 1' as mensaje;

COMMIT;
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script NO elimina usuarios, solo pedidos
-- 2. Los códigos de descuento usados NO se reinician
-- 3. Si tienes otros datos relacionados (facturas, etc.) 
--    considera si también deben eliminarse
-- 4. Recomendación: Haz un backup antes de ejecutar
-- ============================================

-- ============================================================
-- Preservar conteo de pedidos y limpiar historial de items
-- ============================================================
-- Contexto: se actualizó la carta y precios, los pedidos guardados
-- tienen información desactualizada. Se elimina el historial para
-- que no se puedan repetir pedidos con precios viejos.
-- El conteo se preserva en legacy_order_count para la lógica de
-- elegibilidad del descuento de cumpleaños (requiere >= 3 pedidos).
-- ============================================================

-- Paso 1: Agregar columna de respaldo del conteo histórico
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_order_count INT NOT NULL DEFAULT 0;

-- Paso 2: Guardar el conteo actual de pedidos por usuario
UPDATE public.profiles p
SET legacy_order_count = (
  SELECT COUNT(*) FROM public.orders o WHERE o.user_id = p.id
);

-- Paso 3: Eliminar historial de pedidos
DELETE FROM public.orders;

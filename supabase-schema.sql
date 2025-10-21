-- ============================================
-- SCHEMA PARA SISTEMA DE USUARIOS CLIENTES
-- ============================================
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de perfiles de clientes
-- Almacena info adicional del usuario (nombre, teléfono, dirección)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT, -- Dirección de delivery (opcional)
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- Rol del usuario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- RLS: Los usuarios solo pueden ver/editar su propio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 2. Tabla de favoritos
-- Almacena productos favoritos del usuario (referencia por código del producto)
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL, -- código del producto (ej: "001", "002")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_code) -- Un usuario no puede tener duplicados
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_code ON public.favorites(product_code);

-- RLS: Los usuarios solo pueden ver/editar sus propios favoritos
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);


-- 3. Tabla de pedidos
-- Almacena historial de pedidos completos (optimizado con JSONB)
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Array de items OPTIMIZADO: [{ codigo, cantidad, opcion }]
                        -- Ya NO incluye nombre, valor para ahorrar espacio
                        -- La app busca estos datos desde el catálogo de productos
  total INTEGER NOT NULL, -- Total en pesos
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('retiro', 'delivery')),
  address TEXT, -- Solo si es delivery
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar queries de últimos pedidos
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);

-- RLS: Los usuarios solo pueden ver sus propios pedidos
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 4. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 5. Función para crear perfil automáticamente al registrarse
-- (Se ejecuta mediante trigger o desde el frontend)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- GRANTS (permisos para usuarios autenticados)
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- NOTAS DE OPTIMIZACIÓN:
-- ============================================
-- 1. Usamos product_code (TEXT) en vez de product_id para evitar joins
--    y porque los productos están en código (no en DB)
-- 2. JSONB para items de pedidos: ULTRA OPTIMIZADO
--    - Solo guardamos: { codigo, cantidad, opcion }
--    - NO guardamos: nombre, valor, imagen (se buscan en el catálogo)
--    - Reduce el tamaño de cada pedido en ~70%
--    - Ejemplo: [{"codigo":"001","cantidad":2,"opcion":{"id":"p6","label":"6 piezas"}}]
-- 3. Índices estratégicos para queries frecuentes
-- 4. RLS habilitado para seguridad automática
-- 5. Triggers para mantener datos consistentes
-- ============================================

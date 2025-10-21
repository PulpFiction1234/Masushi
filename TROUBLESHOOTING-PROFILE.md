# 🔧 Solución de Problemas - Página de Perfil

## ⚠️ ERROR PRINCIPAL: 404 en Supabase REST API

Si ves estos errores en la consola del navegador:
```
Failed to load resource: the server responded with a status of 404 ()
.../rest/v1/profiles?select=*&id=eq...
.../rest/v1/favorites?select=product_code&user_id=eq...
```

**Y este error en el servidor:**
```
api/orders:1 Failed to load resource: the server responded with a status of 500
```

### 🎯 Causa:
Las tablas `profiles`, `favorites` y `orders` **NO EXISTEN** en tu base de datos de Supabase.

### ✅ Solución URGENTE:

#### 1. Ejecutar el Schema SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en "SQL Editor" en el menú lateral
3. Click en "New Query"
4. Copia TODO el contenido del archivo `supabase-schema.sql`
5. Pégalo en el editor
6. Click en "Run" (o presiona Ctrl+Enter)

**Espera a que termine** - Deberías ver mensajes de éxito como:
```
CREATE TABLE
CREATE INDEX
CREATE POLICY
...etc
```

#### 2. Verificar que las tablas se crearon

En el SQL Editor, ejecuta:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'favorites', 'orders');
```

Deberías ver 3 tablas:
- profiles
- favorites  
- orders

#### 3. Si ya tenías el sistema instalado antes

Si ya tenías las tablas `profiles` y `favorites`, solo necesitas agregar el campo `address`:

1. Ejecuta el archivo `migration-add-address.sql` en el SQL Editor
2. O ejecuta este comando directo:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;
```

#### 4. Verificar variables de entorno

Asegúrate de tener en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
```

#### 5. Reiniciar el servidor de desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## Otros problemas comunes:

### Error: "Unauthorized" en /api/orders
**Causa**: No estás autenticado
**Solución**: Inicia sesión primero en `/login`

### Error: "Cannot read property 'full_name' of null"
**Causa**: El perfil no se creó correctamente al registrarte
**Solución**: 
1. Ve a Supabase → Table Editor → profiles
2. Verifica si existe tu usuario
3. Si no existe, ejecuta manualmente:
```sql
INSERT INTO public.profiles (id, full_name, phone)
VALUES ('tu-user-id', 'Tu Nombre', 'tu-telefono');
```

### La página carga infinitamente
**Causa**: El UserContext está atrapado en un loop
**Solución**: 
1. Limpia el localStorage: Abre DevTools → Application → Local Storage → Clear All
2. Cierra sesión y vuelve a iniciar

### Error 500 persistente en /api/orders
**Causa**: La tabla `orders` no existe o hay un problema de permisos RLS
**Solución**:
```sql
-- Verificar que existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'orders';

-- Si no existe, ejecutar la parte del schema que crea orders
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('retiro', 'delivery')),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y crear policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 Testing paso a paso:

1. **Verificar conexión a Supabase**:
   - Abre DevTools → Network
   - Ve a `/profile`
   - Busca requests a supabase.co
   - Deben responder 200 OK

2. **Verificar autenticación**:
   - Abre DevTools → Application → Cookies
   - Debe haber cookies de supabase (sb-*-auth-token)

3. **Verificar profile load**:
   - Abre DevTools → Console
   - No debe haber errores rojos
   - Si hay "Error loading orders", es normal si no has hecho pedidos

4. **Verificar que se muestran los datos**:
   - Nombre, teléfono y email deben aparecer
   - "Dirección de delivery: No configurada" es normal si no la has configurado
   - "No tienes pedidos" es normal si no has hecho pedidos

---

## 📞 Si nada funciona:

1. Comparte screenshot del error en la consola del navegador
2. Comparte el error del terminal donde corre `npm run dev`
3. Verifica que ejecutaste TODO el `supabase-schema.sql`
4. Verifica que las variables de entorno son correctas

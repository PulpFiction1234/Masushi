# Sistema de Usuarios Clientes - Masushi

## Resumen de la implementación

Se ha implementado un sistema completo de usuarios clientes con las siguientes funcionalidades:

### ✅ Funcionalidades implementadas

1. **Sistema de registro y autenticación**
   - Página de registro (`/register`) con nombre, correo, teléfono y contraseña
   - Integración con Supabase Auth
   - Almacenamiento de perfil en tabla `profiles`

2. **Sistema de favoritos**
   - Botón de corazón en cada producto (ProductCard)
   - Nueva categoría "Mis favoritos" en el menú
   - Sincronización con base de datos en tiempo real
   - Solo visible para usuarios autenticados

3. **Historial de pedidos**
   - Guardado automático de pedidos al confirmar en checkout
   - Últimos 5 pedidos visibles en perfil
   - Función "Repetir pedido" que agrega todos los items al carrito

4. **Página de perfil (`/profile`)**
   - Ver y editar nombre y teléfono
   - Ver y editar dirección de delivery (opcional)
   - Ver email (no editable)
   - Autocompletado de dirección en checkout
   - Lista de últimos pedidos con detalles
   - Botón de cerrar sesión

5. **Navegación mejorada**
   - Iconos de favoritos y perfil en el navbar cuando hay sesión
   - Botón de "Ingresar" cuando no hay sesión
   - Links entre login y registro

## 📋 Configuración de Supabase

### ⚠️ PASO 1 - CRÍTICO: Ejecutar el schema SQL PRIMERO

**🚨 Sin este paso, nada funcionará. Verás errores 404 y 500.**

#### Para instalación nueva:

1. **Ve a [Supabase Dashboard](https://supabase.com/dashboard)** → Tu proyecto
2. **Click en "SQL Editor"** en el menú lateral
3. **Click en "+ New Query"**
4. **Abre el archivo** `supabase-schema.sql` (está en la raíz del proyecto)
5. **Copia TODO su contenido** (Ctrl+A, Ctrl+C)
6. **Pégalo en el editor SQL** de Supabase
7. **Click en "Run"** (botón verde) o presiona `Ctrl + Enter`

Verás mensajes como:
```
✓ CREATE TABLE
✓ CREATE INDEX  
✓ CREATE POLICY
✓ CREATE FUNCTION
✓ CREATE TRIGGER
```

#### ✅ Verificar que funcionó:

En el SQL Editor, ejecuta esto:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'favorites', 'orders');
```

**Debes ver 3 filas:** `profiles`, `favorites`, `orders`

Si no aparecen las 3 tablas, **repite el proceso desde el paso 1**.

#### Si ya tenías el sistema anterior (sin dirección):

Solo ejecuta `migration-add-address.sql` en lugar del schema completo.

---

### 2. Contenido del Schema

El script `supabase-schema.sql` crea:

- Tabla `profiles` (nombre, teléfono, dirección)
- Tabla `favorites` (productos favoritos)
- Tabla `orders` (historial de pedidos)
- Políticas RLS para seguridad
- Triggers automáticos
- Funciones auxiliares

### 2. Configurar variables de entorno

Asegúrate de tener en tu `.env.local`:

```env
# Supabase (públicas - cliente)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima

# Supabase (privadas - servidor)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role

# WhatsApp / proveedor de mensajería (opcional - si quieres notificaciones automáticas)
# Ejemplo para Meta WhatsApp Cloud API:
# WHATSAPP_API_URL=https://graph.facebook.com/v16.0/<PHONE_NUMBER_ID>/messages
# WHATSAPP_TOKEN=<ACCESS_TOKEN>
# WHATSAPP_TEMPLATE_NAME=<NOMBRE_DE_PLANTILLA_APROBADA>
# WHATSAPP_TEMPLATE_LANG=es_CL
# INTERNAL_WHATSAPP_NUMBER=<telefono_interno_para_notificaciones>

# Nota: WHATSAPP_SENDER puede usarse para algunos proveedores que requieren un sender id.
```

### 3. Configurar autenticación en Supabase

En el dashboard de Supabase:

1. **Authentication > Providers**
   - Habilitar "Email" provider
   - Configurar si quieres confirmación por email (opcional)

2. **Authentication > Email Templates**
   - Personalizar plantillas de confirmación si las activas

3. **Authentication > URL Configuration**
   - Agregar tu dominio en "Site URL"
   - Agregar redirect URLs necesarias

## 🗂️ Estructura de archivos creados/modificados

### Nuevos archivos:

```
supabase-schema.sql              # Schema de base de datos
src/types/user.ts                # Tipos TypeScript
src/context/UserContext.tsx     # Contexto de usuario y favoritos
src/pages/register.tsx           # Página de registro
src/pages/profile.tsx            # Página de perfil
src/pages/api/favorites.ts       # API de favoritos
src/pages/api/orders.ts          # API de pedidos
src/pages/api/profile.ts         # API de perfil
```

### Archivos modificados:

```
src/pages/_app.tsx               # Agregado UserProvider
src/components/ProductCard.tsx   # Agregado botón de favoritos
src/components/ListaProductos.tsx # Soporte para "Mis favoritos"
src/pages/menu.tsx               # Nueva categoría y filtros
src/components/Navbar.tsx        # Iconos de perfil/favoritos/login
src/pages/login.tsx              # Link a registro
src/pages/checkout.tsx           # Guardado de pedidos
```

## 🚀 Cómo usar

### Para usuarios (clientes):

1. **Registrarse**: Ir a `/register` o hacer clic en "Ingresar" → "Regístrate aquí"
2. **Configurar perfil**: Ir a `/profile` y agregar dirección de delivery
3. **Agregar favoritos**: Click en el corazón de cualquier producto
4. **Ver favoritos**: Seleccionar "Mis favoritos" en el menú
5. **Hacer pedido**: La dirección se autocompletará si está guardada en el perfil
6. **Repetir pedido**: En el perfil, click en "Repetir pedido"

### Para admins:

- Los admins siguen usando `/login` y `/admin` como antes
- No hay conflicto con el sistema de clientes

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Los usuarios solo pueden ver/editar sus propios datos
- Políticas automáticas mediante triggers
- Service role key solo se usa en servidor (API routes)

## 🎨 Optimizaciones de BD

1. **Almacenamiento eficiente**:
   - Favoritos: Solo código de producto (TEXT) en vez de joins complejos
   - Pedidos: Items en JSONB (compacto y flexible)
   - Dirección: Campo opcional en perfil (no crea tabla separada)
   - Sin redundancia de datos de productos

2. **Índices estratégicos**:
   - `idx_favorites_user_id` para queries rápidas por usuario
   - `idx_orders_user_created` para últimos pedidos ordenados
   - Índice compuesto para evitar duplicados en favoritos

3. **Triggers automáticos**:
   - Creación de perfil al registrarse
   - Actualización de `updated_at`
   - Limpieza en cascada al borrar usuarios

## 🧪 Testing

### Verificar instalación:

1. Ejecutar TypeScript check:
   ```bash
   npx tsc --noEmit
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Probar flujos:
   - Registro → Login → Configurar dirección en perfil
   - Hacer checkout tipo delivery → Verificar autocompletado
   - Agregar favorito → Ver perfil → Repetir pedido

### Endpoints API:

- `GET /api/favorites` - Obtener favoritos
- `POST /api/favorites` - Agregar favorito
- `DELETE /api/favorites?productCode=XXX` - Eliminar favorito
- `GET /api/orders` - Obtener últimos 5 pedidos
- `POST /api/orders` - Crear pedido (automático en checkout)
- `GET /api/profile` - Obtener perfil
- `PUT /api/profile` - Actualizar perfil

## 📝 Notas adicionales

### Diferenciación admin/cliente:

- Los admins se crean manualmente (no hay registro público para ellos)
- El middleware protege `/admin` y `/api/admin/*`
- Los clientes usan `/profile` y pueden hacer pedidos

### Confirmación de email:

Por defecto, el registro es instantáneo. Si quieres activar confirmación por email:

1. En Supabase Dashboard → Authentication → Email Auth
2. Habilitar "Confirm email"
3. Actualizar mensaje en `register.tsx` para indicar que deben confirmar

### Personalización:

- Cambiar colores en los componentes (actualmente usa rojo/verde)
- Ajustar límite de pedidos mostrados (actualmente 5)
- Agregar más campos al perfil si necesitas

## 🐛 Troubleshooting

**Error: "Expected 1 arguments, but got 2"**
- Ya corregido en `register.tsx` usando `options: { data: {...} }`

**Favoritos no aparecen**
- Verificar que el schema SQL se ejecutó correctamente
- Verificar RLS policies en Supabase

**Pedidos no se guardan**
- Verificar que el usuario está autenticado
- Revisar console del navegador por errores
- Verificar que la API route `/api/orders` responde

**"Mis favoritos" no aparece en el menú**
- Solo aparece si el usuario está logueado
- Verificar que `useUser()` retorna el usuario

## ✅ Checklist de deployment

- [ ] Ejecutar `supabase-schema.sql` en producción
- [ ] Configurar variables de entorno en Vercel/host
- [ ] Configurar URLs en Supabase Authentication
- [ ] Probar registro y login en producción
- [ ] Verificar que RLS está habilitado
- [ ] Probar flujo completo: registro → favoritos → pedido → perfil

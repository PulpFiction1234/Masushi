# 🔐 Sistema de Roles y Acceso Admin

## Resumen

Se ha implementado un sistema de roles para controlar el acceso a la página `/admin`. Solo los usuarios con rol `admin` pueden acceder.

## 📋 Configuración Inicial

### 1. Agregar campo `role` a la tabla profiles

Si ya tienes la base de datos creada, ejecuta el archivo `migration-add-role.sql`:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto
2. Click en **"SQL Editor"**
3. Copia el contenido de `migration-add-role.sql`
4. Ejecuta el script

Si estás creando la base de datos por primera vez, el campo `role` ya está incluido en `supabase-schema.sql`.

## 👑 Cómo hacer a un usuario Admin

### Método 1: Desde Supabase SQL Editor

```sql
-- Reemplaza el email con el del usuario que quieres hacer admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);
```

### Método 2: Desde Supabase Table Editor

1. Ve a **Table Editor** → `profiles`
2. Busca el usuario por su nombre o email
3. Haz click en la fila
4. Cambia el campo `role` de `user` a `admin`
5. Guarda

## 🔍 Ver todos los usuarios y sus roles

```sql
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY p.created_at DESC;
```

## 🛡️ Protección Implementada

### Nivel Frontend (`/admin/index.tsx`)
- Verifica que el usuario esté autenticado
- Verifica que `profile.role === 'admin'`
- Redirige a `/login` si no está autenticado
- Redirige a `/` con alerta si no es admin
- Muestra "Verificando permisos..." mientras carga

### Nivel Backend (`/api/admin/mode.ts`)
- Verifica sesión de Supabase
- Consulta el rol desde la tabla `profiles`
- Retorna `403 Forbidden` si no es admin
- Protege tanto GET como POST

## 📝 Roles Disponibles

- **`user`** (default): Usuario normal, puede hacer pedidos y ver su perfil
- **`admin`**: Usuario administrador, puede acceder al panel `/admin`

## ⚠️ Importante

- **Por defecto todos los usuarios son `user`**
- Debes asignar manualmente el rol `admin` desde Supabase
- No hay interfaz en la app para cambiar roles (es intencional por seguridad)
- Los admins también pueden hacer pedidos normales

## 🧪 Pruebas

### Verificar que funciona correctamente:

1. **Como usuario normal:**
   - Intenta acceder a `/admin`
   - Deberías ver: "No tienes permisos para acceder a esta página"
   - Serás redirigido a `/`

2. **Como admin:**
   - Accede a `/admin`
   - Deberías ver: "Panel de pedidos" con opciones de modo
   - Puedes cambiar entre Normal, Forzado Abierto, Forzado Cerrado

3. **Sin autenticación:**
   - Accede a `/admin`
   - Serás redirigido a `/login?redirect=/admin`
   - Después de login exitoso, volverás a `/admin`

## 🔧 Solución de Problemas

### "No tienes permisos..." incluso siendo admin
1. Verifica que el campo `role` existe en la tabla `profiles`:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```
2. Verifica tu rol:
   ```sql
   SELECT role FROM public.profiles 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
   ```
3. Si es `NULL` o `user`, ejecútalo de nuevo la query para hacerte admin

### La página /admin se queda cargando
1. Abre DevTools → Console
2. Busca errores relacionados con Supabase
3. Verifica que la tabla `profiles` existe y tiene el campo `role`
4. Cierra sesión y vuelve a iniciar sesión

### Error 403 en /api/admin/mode
- La API está verificando correctamente que no eres admin
- Ejecuta la query SQL para hacerte admin
- Refresca la página

## 🎯 Próximos pasos

Si quieres agregar más roles (ej: `moderator`, `superadmin`), modifica:
1. El CHECK constraint en `supabase-schema.sql`
2. El tipo TypeScript en `src/types/user.ts`
3. Las verificaciones en páginas y APIs

# 🗑️ Guía para Gestionar y Eliminar Usuarios

Esta guía te explica cómo ver, filtrar y eliminar usuarios de tu base de datos en Supabase.

## 📍 Ubicación del Script

El script SQL está en: [`scripts/manage-users.sql`](scripts/manage-users.sql)

## 🚀 Cómo Usar

### Paso 1: Abrir el SQL Editor en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**

### Paso 2: Elegir una Opción

Abre el archivo [`scripts/manage-users.sql`](scripts/manage-users.sql) y copia la sección que necesites.

## 📋 Opciones Disponibles

### 🔍 OPCIÓN 1: Ver Todos los Usuarios

Lista todos los usuarios con información básica (nombre, email, pedidos, etc.)

```sql
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
```

### 🔎 OPCIÓN 2: Buscar por Email

```sql
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
```

**Reemplaza** `email@ejemplo.com` con el email que buscas.

### 📊 OPCIÓN 3: Ver Detalles de un Usuario

Muestra toda la información de un usuario específico (pedidos, favoritos, códigos, etc.)

**Reemplaza** el UUID en la línea:
```sql
v_uid uuid := 'REEMPLAZAR-CON-UUID-DEL-USUARIO';
```

### ❌ OPCIÓN 4: Eliminar por UUID

Elimina un usuario específico usando su ID.

⚠️ **ADVERTENCIA**: Esta acción es PERMANENTE y eliminará:
- El usuario de `auth.users`
- Su perfil en `profiles`
- Todos sus pedidos
- Todos sus favoritos
- Todos sus códigos de descuento

**Reemplaza** el UUID antes de ejecutar.

### 📧 OPCIÓN 5: Eliminar por Email

Elimina un usuario usando su email.

**Reemplaza** el email en:
```sql
v_email text := 'email@ejemplo.com';
```

### 🧪 OPCIÓN 6: Eliminar Usuarios de Prueba

Elimina TODOS los usuarios que tengan emails con:
- `test`
- `ejemplo`
- `demo`
- `prueba`

**⚠️ CUIDADO**: Esto puede eliminar múltiples usuarios a la vez.

### 🚫 OPCIÓN 7: Eliminar Usuarios Sin Pedidos

Elimina usuarios que se registraron pero nunca hicieron un pedido.

**No elimina admins** - solo usuarios normales sin actividad.

### 📅 OPCIÓN 8: Eliminar Usuarios Creados Hoy

Útil para limpiar pruebas del día.

### ✅ OPCIÓN 9: Verificar Totales

Verifica cuántos registros quedan en cada tabla después de eliminar.

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COUNT(*) FROM public.favorites) as total_favorites,
  (SELECT COUNT(*) FROM public.discount_codes) as total_discount_codes;
```

## 🎯 Casos de Uso Comunes

### Caso 1: Eliminar un usuario específico

1. Ejecuta **OPCIÓN 1** para ver todos los usuarios
2. Copia el `id` (UUID) del usuario que quieres eliminar
3. Usa **OPCIÓN 4** y pega el UUID
4. Ejecuta el script

### Caso 2: Limpiar usuarios de prueba

1. Ejecuta **OPCIÓN 6** directamente
2. Verifica los resultados con **OPCIÓN 9**

### Caso 3: Eliminar usuarios inactivos

1. Ejecuta **OPCIÓN 7** para eliminar usuarios sin pedidos
2. Verifica con **OPCIÓN 9**

## ⚠️ Advertencias Importantes

### 🔴 ANTES DE ELIMINAR:

1. **Haz un backup** de tu base de datos si tienes datos importantes
2. **Verifica dos veces** el UUID o email antes de ejecutar
3. **Lee los mensajes** de confirmación que aparecen en el resultado
4. **No puedes deshacer** una eliminación

### ✅ Protecciones Incluidas:

- El script **NO eliminará admins** (en OPCIÓN 7)
- Cada eliminación muestra un mensaje de confirmación
- Las opciones peligrosas tienen advertencias claras
- El sistema usa `CASCADE`, así que todo se elimina limpiamente

## 🔧 Solución de Problemas

### "No puedo eliminar un usuario desde el Dashboard"

**Razón**: Supabase UI a veces no muestra la opción de eliminar usuarios con datos relacionados.

**Solución**: Usa el script SQL en lugar del Dashboard.

### "Error: violates foreign key constraint"

**Razón**: Las tablas tienen restricciones de clave foránea.

**Solución**: El esquema ya tiene `ON DELETE CASCADE`, así que esto no debería pasar. Si ocurre, verifica que ejecutaste el [`supabase-schema.sql`](supabase-schema.sql) correctamente.

### "No aparecen mensajes NOTICE"

**Razón**: Algunos clientes SQL no muestran los mensajes NOTICE.

**Solución**: 
- En Supabase SQL Editor, busca la pestaña **Messages** debajo del resultado
- O ejecuta **OPCIÓN 9** para verificar los totales

## 📝 Ejemplo Práctico

```sql
-- 1. Ver usuarios actuales
SELECT email, created_at FROM auth.users ORDER BY created_at DESC;

-- 2. Eliminar usuario específico
DO $$
DECLARE
  v_email text := 'test@ejemplo.com';
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  DELETE FROM auth.users WHERE id = v_uid;
  RAISE NOTICE 'Usuario % eliminado', v_email;
END $$;

-- 3. Verificar
SELECT COUNT(*) as usuarios_restantes FROM auth.users;
```

## 🔗 Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL DELETE CASCADE](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Script SQL Completo](scripts/manage-users.sql)

---

**💡 Tip**: Guarda el UUID de tu usuario admin en un lugar seguro para no eliminarlo accidentalmente.

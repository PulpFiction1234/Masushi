# Auditoría de recuperación de contraseña

Fecha: 2026-11-06

## Resolución aplicada (2026-11-06, segunda revisión)

Se corrigieron todos los hallazgos bloqueantes y altos:

1. **Envío de correo reescrito**: nuevo endpoint `POST /api/auth/request-password-reset` que genera el enlace con `admin.generateLink` y lo envía por el SMTP propio (nodemailer), el mismo canal que ya funciona para los códigos de verificación. Fallback al correo de Supabase si el SMTP falla. Ver [PASSWORD-RESET-SETUP.md](PASSWORD-RESET-SETUP.md).
2. **Bug crítico en `/reset-password`**: el formulario dependía del evento `PASSWORD_RECOVERY`, que nunca se emite con `detectSessionInUrl: false` + intercambio manual (`exchangeCodeForSession`/`setSession` emiten `SIGNED_IN`). Ahora la página habilita el formulario directamente al establecer la sesión desde la URL.
3. **PKCE cross-device resuelto**: el enlace generado en servidor redirige con tokens en el hash, válidos en cualquier dispositivo/navegador.
4. **Sesión previa**: el enlace de recuperación ahora prevalece sobre una sesión ordinaria activa (antes se omitía el intercambio y se mostraba "enlace inválido").
5. **Refresh de la página**: se mantiene el acceso al formulario con una marca en `sessionStorage`; una sesión ordinaria sin la marca sigue siendo rechazada.
6. **Pantalla de éxito**: se reordenó el render para que el `signOut` posterior a actualizar el PIN no reemplace el mensaje de éxito por "enlace inválido".
7. **Rate limit y privacidad**: cooldown de 60 s por correo y respuesta genérica que no revela si el correo está registrado.

Pendiente de verificación manual fuera del repositorio:

- Plantilla **Reset Password** de Supabase con `{{ .ConfirmationURL }}` (solo se usa en el fallback).
- Variables `SMTP_*`/`FROM_EMAIL` presentes en Vercel.

## Resumen ejecutivo (revisión original)

Se encontraron dos problemas bloqueantes:

1. La producción de Vercel todavía no contiene las rutas de recuperación.
2. Existe lógica de aceptación de sesión demasiado amplia en la página de restablecimiento.

Las rutas nuevas no están desplegadas, aunque el commit correspondiente existe en GitHub. Por eso, tanto el enlace configurado como la entrada de recuperación pueden terminar en 404 o no estar disponibles para los usuarios.

## Resultado comprobado

| URL | Resultado observado |
|---|---|
| https://www.masushi.cl/login | HTTP 200 |
| https://www.masushi.cl/forgot-password | HTTP 404 |
| https://www.masushi.cl/reset-password | HTTP 404 |

La página de inicio de sesión en producción no contiene el texto "Olvidaste tu PIN". Esto confirma que el código nuevo no está incluido en el despliegue activo.

## Hallazgos

### 1. Despliegue de producción desactualizado — bloqueante

Las rutas `/forgot-password` y `/reset-password` existen localmente, pero producen 404 en producción.

Referencia local: [forgot-password.tsx](src/pages/forgot-password.tsx) y [reset-password.tsx](src/pages/reset-password.tsx).

Impacto:

- El correo puede abrir la URL correcta pero termina mostrando la página 404.
- El usuario puede quedar sin acceso al flujo.

Acción requerida:

- Resolver por qué el commit nuevo no dispara o termina en el deployment de Vercel.
- Confirmar que el deployment activo de producción contiene commit `37fd983696673d6f6ddf0dcd1be2097cb8fa2d6f`.
- Promover ese deployment a producción o hacer redeploy manual de esa rama/commit.

### 2. Plantilla de correo de Supabase puede omitir el enlace — bloqueante

La aplicación envía `redirectTo` mediante `resetPasswordForEmail`, pero Supabase también controla qué URL aparece en el correo.

Referencia local: [forgot-password.tsx](src/pages/forgot-password.tsx:28)

La plantilla de recuperación debe incluir:

```html
<a href="{{ .ConfirmationURL }}">Crear un nuevo PIN</a>
```

No debe usar solamente `{{ .SiteURL }}` ni `{{ .RedirectTo }}`, porque eso puede llevar al inicio o al dominio incorrecto.

Además deben estar permitidas estas URLs:

- `https://www.masushi.cl/reset-password`
- `http://localhost:3000/reset-password`, solo si se necesita desarrollo local

No se puede verificar desde este repositorio si la plantilla y las Redirect URLs fueron guardadas correctamente en el proyecto Supabase.

### 3. Sesión ordinaria puede habilitar el formulario de cambio — alto

La página acepta cualquier sesión activa:

```tsx
if (event === "PASSWORD_RECOVERY" || session) setReady(Boolean(session));
```

Referencia: [reset-password.tsx](src/pages/reset-password.tsx:53).

Esto permite que una persona que ya inició sesión llegue manualmente a `/reset-password` y vea el formulario sin haber recibido un enlace de recuperación.

Acción recomendada: aceptar solamente el evento `PASSWORD_RECOVERY` o utilizar un único estado de recuperación separado.

### 4. El `code` PKCE puede permanecer en la URL — medio

Después de intercambiar el código, la página conserva parte de la URL original:

```tsx
window.history.replaceState(null, "", `${url.pathname}${url.search}`);
```

Referencia: [reset-password.tsx](src/pages/reset-password.tsx:42).

Si el enlace contiene `?code=...`, el valor puede quedar visible al refrescar o navegar. No es la causa principal del 404, pero conviene limpiar el código inmediatamente después de intercambiarlo.

### 5. No se procesan errores OAuth presentes en el hash — medio

El flujo solo interpreta `access_token` y `refresh_token`. Si Supabase devuelve `error`, `error_description` o `error_code` en el fragmento, se muestra un mensaje genérico o se considera inválido.

Referencia: [reset-password.tsx](src/pages/reset-password.tsx:32).

Acción recomendada: detectar y traducir explícitamente esos parámetros antes de consultar la sesión.

### 6. El enlace puede quedar asociado al dominio o redirect incorrecto — medio

La URL destino se calcula con `NEXT_PUBLIC_SITE_URL` o el origen de la pestaña actual.

Referencia: [forgot-password.tsx](src/pages/forgot-password.tsx:27).

Esto hace que un uso desde una URL distinta genere una redirección distinta. La producción debería usar siempre una variable pública explícita configurada para `https://www.masushi.cl`.

### 7. La ruta no valida sesión de recuperación antes de actualizar — medio

En el envío se llama directamente a `updateUser`. Esto depende de que la sesión recuperada siga activa. Si la sesión expira o fue reemplazada por otra sesión durante la carga, el formulario puede mostrar un error poco claro.

Acción recomendada: verificar antes de guardar que todavía existe sesión y que corresponda a recuperación.

## Prioridad recomendada

1. Publicar el nuevo código en producción.
2. Verificar plantilla y Redirect URLs de Supabase.
3. Restringir el formulario al evento `PASSWORD_RECOVERY`.
4. Limpiar tokens/códigos de la URL.
5. Procesar errores enviados por Supabase.

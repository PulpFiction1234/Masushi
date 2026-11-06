# Configuración de recuperación de PIN

> **Visibilidad**: las opciones de recuperar/cambiar PIN están ocultas en login y perfil detrás del flag `PASSWORD_RECOVERY_ENABLED` en [featureFlags.ts](src/utils/featureFlags.ts). Cambiar a `true` para reactivarlas cuando el flujo esté validado en producción.

## Arquitectura

La recuperación de PIN funciona **antes de iniciar sesión** y usa un envío de correo propio, porque el servicio de email integrado de Supabase (plan Free) es limitado y poco confiable:

1. El usuario ingresa su correo en `/forgot-password`.
2. La página llama a `POST /api/auth/request-password-reset`.
3. El servidor genera el enlace de recuperación con `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })` y lo envía con el SMTP propio (`src/utils/sendEmail.ts`, nodemailer), con la misma identidad de marca del código de verificación.
4. Si el SMTP falla, se usa como respaldo el correo integrado de Supabase (`resetPasswordForEmail`).
5. El enlace abre `/reset-password` con tokens en el hash (`#access_token=...&refresh_token=...`), que funcionan **en cualquier dispositivo o navegador** (no depende del code verifier PKCE del navegador que pidió el correo).
6. La página establece la sesión de recuperación y muestra el formulario para crear el nuevo PIN.

Archivos clave:

- [request-password-reset.ts](src/pages/api/auth/request-password-reset.ts) — endpoint con rate limit (60 s por correo) y respuesta genérica (no revela si el correo existe).
- [passwordReset.ts](src/server/passwordReset.ts) — genera el enlace y envía el correo branded, con fallback a Supabase.
- [forgot-password.tsx](src/pages/forgot-password.tsx) — formulario de solicitud.
- [reset-password.tsx](src/pages/reset-password.tsx) — valida el enlace y actualiza el PIN.

## Variables de entorno requeridas

En Vercel (y `.env.local` para desarrollo):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` — SMTP propio (obligatorio para el envío confiable).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — para generar el enlace con el admin API.
- `NEXT_PUBLIC_SITE_URL=https://www.masushi.cl`.
- `PASSWORD_RESET_EXPIRY_MINUTES` (opcional, default 60) — solo afecta el texto del correo; la expiración real la define Supabase (OTP expiry, 1 hora por defecto).

## Configuración en Supabase

1. Abre **Authentication > URL Configuration**.
2. Configura **Site URL** con la URL pública: `https://www.masushi.cl`.
3. Añade como **Redirect URLs**:
   - `https://www.masushi.cl/reset-password`
   - `http://localhost:3000/reset-password` (solo si pruebas en desarrollo local)

> Sin la Redirect URL permitida, `generateLink` falla y no se envía ningún correo.

## Plantilla de correo de Supabase (solo respaldo)

El envío principal no usa la plantilla de Supabase, pero el **fallback** sí. En **Authentication > Email Templates > Reset Password**, el cuerpo HTML debe incluir:

```html
<h2>Recupera tu PIN en Masushi</h2>
<p><a href="{{ .ConfirmationURL }}">Crear un nuevo PIN</a></p>
<p>Si no solicitaste este cambio, ignora este correo.</p>
```

Sin `{{ .ConfirmationURL }}`, el correo de respaldo no tendrá el enlace correcto. Si el botón usa solamente `{{ .SiteURL }}` o `{{ .RedirectTo }}`, abrirá el inicio de la web y nunca llegará a `/reset-password`.

## Cambio de PIN con sesión iniciada

El cambio de PIN para usuarios autenticados está en [profile.tsx](src/pages/profile.tsx:419): pide el PIN actual, lo verifica re-autenticando contra Supabase y luego actualiza con `updateUser`. No requiere correo.

# Verificación por Email - Configuración

## 📧 Descripción

Se ha implementado un sistema de verificación por email con código OTP (One Time Password) de 6 dígitos para el registro de usuarios.



## 🔧 Configuración en Supabase

### 1. Habilitar Verificación por Email

Ve a tu proyecto en Supabase Dashboard:

1. **Authentication** → **Settings** → **Email Auth**
2. Verifica que esté habilitado:
   - ✅ **Enable email confirmations** (Habilitar confirmaciones por email)
3. **Email Templates** → **Confirm signup**
   - Puedes personalizar el template del email de confirmación
   - Por defecto, Supabase enviará un código de 6 dígitos

### 2. Configurar Proveedor de Email

Supabase incluye un servidor SMTP por defecto para desarrollo, pero para producción debes configurar tu propio proveedor:

#### Opción A: Gmail (Desarrollo)
1. **Settings** → **Auth** → **SMTP Settings**
2. Configura:
   - **Sender email**: tu-email@gmail.com
   - **Sender name**: Masushi
   - **SMTP Host**: smtp.gmail.com
   - **SMTP Port**: 587
   - **SMTP Username**: tu-email@gmail.com
   - **SMTP Password**: (contraseña de aplicación)

> **Nota**: Para Gmail, necesitas crear una "App Password" en tu cuenta de Google.

#### Opción B: SendGrid (Producción Recomendada)
1. Crea cuenta en [SendGrid](https://sendgrid.com/)
2. Obtén tu API Key
3. En Supabase **SMTP Settings**:
   - **SMTP Host**: smtp.sendgrid.net
   - **SMTP Port**: 587
   - **SMTP Username**: apikey
   - **SMTP Password**: [tu-api-key-de-sendgrid]

#### Opción C: Resend (Moderna y Fácil)
1. Crea cuenta en [Resend](https://resend.com/)
2. Obtén tu API Key
3. En Supabase **SMTP Settings**:
   - **SMTP Host**: smtp.resend.com
   - **SMTP Port**: 587
   - **SMTP Username**: resend
   - **SMTP Password**: [tu-api-key-de-resend]

### 3. Personalizar Template de Email (Opcional)

Ve a **Authentication** → **Email Templates** → **Confirm signup**

Template de ejemplo: puedes pegar cualquiera de los siguientes bloques en el campo "Message body" (tab "Source") dentro de **Confirm signup**.

1) Template simple (OTP - recomendado)

```html
<h2>¡Bienvenido a Masushi!</h2>
<p>Gracias por registrarte. Tu código de verificación es:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; font-family: monospace; color: #ef4444; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">{{ .Token }}</h1>
<p><strong>Este código expirará en 24 horas.</strong></p>
<p>Si no solicitaste este registro, puedes ignorar este email.</p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
<p style="color: #6b7280; font-size: 12px;">
   Este es un email automático de Masushi. Por favor no respondas a este mensaje.
</p>
```

2) Template visual (OTP con diseño)

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
   <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1f2937; margin: 0;">🍣 Masushi</h1>
   </div>
  
   <div style="background: #f9fafb; border-radius: 12px; padding: 30px; text-align: center;">
      <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido!</h2>
      <p style="color: #4b5563; font-size: 16px;">Para verificar tu cuenta, ingresa este código:</p>
    
      <div style="background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
         <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #ef4444; font-family: monospace;">{{ .Token }}</div>
      </div>
    
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
         Este código expirará en <strong>24 horas</strong>
      </p>
   </div>
  
   <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Si no solicitaste este registro, ignora este email.</p>
   </div>
</div>
```

3) (Opcional) Fallback con link de confirmación

Si prefieres usar el link de confirmación en lugar del código OTP, puedes pegar este template; contiene la URL de confirmación que Supabase genera (`{{ .ConfirmationURL }}`). Útil si quieres que el usuario confirme con un click.

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

Pasos para pegar el template en Supabase:

1. Entra en tu proyecto de Supabase → **Authentication** → **Emails** → pestaña **Templates**.
2. Selecciona **Confirm signup**.
3. Cambia a la vista **Source** y pega uno de los templates anteriores.
4. Guarda los cambios con **Save**.
5. Asegúrate de que en **Authentication → Settings → Email Auth** esté habilitado "Enable email confirmations" y, si existe, la opción para enviar OTP (email token) esté activada.

Importante: utiliza `{{ .Token }}` en los templates OTP (esto es lo que tu frontend recibirá) y `{{ .ConfirmationURL }}` si usas link de confirmación.

### 4. Configurar Duración del Token (Opcional)

Por defecto, los códigos OTP expiran en 24 horas. Para cambiar esto:

1. **Settings** → **Auth** → **Email Auth**
2. Ajusta **Email confirmation token expiry** (ej: 3600 segundos = 1 hora)

## 📝 Flujo de Usuario

### Registro
1. Usuario completa formulario (nombre, email, teléfono, contraseña)
2. Click en "Crear cuenta"
3. Sistema envía código de 6 dígitos al email
4. Usuario pasa automáticamente a pantalla de verificación

### Verificación
1. Usuario ingresa código de 6 dígitos recibido por email
2. Click en "Verificar código"
3. Si el código es correcto:
   - ✅ Email verificado
   - ✅ Sesión iniciada automáticamente
   - ✅ Redirigido a /menu

### Opciones Adicionales
- **Reenviar código**: Si no recibió el email o expiró
- **Volver atrás**: Para corregir el email si se equivocó

## 🧪 Testing

### Desarrollo (Sin SMTP configurado)
Si no tienes SMTP configurado, Supabase NO enviará emails en desarrollo. Para probar:

1. Ve a **Authentication** → **Users** en Supabase Dashboard
2. Verás el usuario con estado `email_confirmed: false`
3. Puedes confirmar manualmente haciendo click en el usuario y marcando el email como verificado

### Desarrollo (Con SMTP configurado)
1. Usa un email real
2. Revisa tu bandeja de entrada (y spam)
3. Ingresa el código de 6 dígitos

### Producción
- Asegúrate de tener SMTP configurado con SendGrid, Resend, u otro proveedor profesional
- Configura SPF, DKIM, y DMARC para evitar que los emails caigan en spam
- Usa tu propio dominio para enviar emails (ej: noreply@masushi.com)

## 🔒 Seguridad

### Códigos OTP
- ✅ Expiran automáticamente (24h por defecto)
- ✅ Solo se pueden usar una vez
- ✅ Son aleatorios y únicos por usuario
- ✅ No se pueden reutilizar códigos anteriores

### Rate Limiting
Supabase tiene rate limiting incorporado para prevenir spam:
- Máximo de intentos de verificación por IP
- Máximo de reenvíos de código por período de tiempo

El endpoint alternativo `/api/auth/verify-code` utiliza un limitador independiente:
8 intentos por cuenta y 20 por IP en una ventana de una hora. Los intentos
agotados responden 429; si el limitador o la IP confiable no están disponibles,
responde 503. Esto no cambia el limitador de recuperación de PIN ni el flujo OTP
de Supabase. Varias personas pueden compartir una IP y un tercero puede agotar
el límite de una cuenta.

Antes de desplegar este cambio, revisar y probar de forma aislada
`migrations/20261124_verification_rate_limit.sql`, y obtener autorización
separada para aplicarla y configurar el entorno. Requiere
el esquema `private` existente con permiso `USAGE` para `service_role`,
`VERIFICATION_RATE_LIMIT_HMAC_SECRET` (secreto privado independiente de al menos
32 bytes) y `VERIFICATION_TRUST_VERCEL_IP=true` solo cuando se haya verificado
que Vercel proporciona el encabezado `x-real-ip` confiable. Sin estos requisitos
el endpoint alternativo no funciona. Planificar también la limpieza periódica de
contadores vencidos con `private.cleanup_verification_rate_limits`, limitada a
una identidad autorizada. No registrar ni compartir el secreto.

## 🎨 Personalización

### Mensaje de Bienvenida
El template de email se puede personalizar completamente en Supabase Dashboard. Puedes incluir:
- Logo de Masushi
- Colores de tu marca
- Links a redes sociales
- Información de contacto

### Tiempos de Espera
Puedes agregar un contador de tiempo en el frontend para reenvío:

```tsx
// Ejemplo: deshabilitar reenvío por 60 segundos
const [canResend, setCanResend] = useState(false);
const [resendTimer, setResendTimer] = useState(60);
```

## 🐛 Troubleshooting

### "Email not sent" / No llegan emails
1. Verifica que SMTP esté configurado correctamente
2. Revisa los logs en Supabase Dashboard → Logs
3. Verifica carpeta de spam
4. Asegúrate que el email del remitente esté verificado

### "Invalid or expired token"
1. El código expiró (24h por defecto)
2. El código ya fue usado
3. El usuario intentó verificar con un código de otro email
4. Usa "Reenviar código" para obtener uno nuevo

### Usuarios no pueden hacer login después de registro
1. Verifica que la verificación se completó exitosamente
2. En Supabase Dashboard → Users, verifica que `email_confirmed: true`
3. Si está en `false`, puedes confirmar manualmente o pedir al usuario que reenvíe el código

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

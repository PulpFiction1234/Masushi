# Configuración de recuperación de PIN

El correo de recuperación debe contener el enlace `{{ .ConfirmationURL }}`. En Supabase:

1. Abre **Authentication > URL Configuration**.
2. Configura **Site URL** con la URL pública, por ejemplo `https://www.masushi.cl`.
3. Añade como **Redirect URLs**:
   - `https://www.masushi.cl/reset-password`
   - `http://localhost:3000/reset-password` (solo desarrollo)
4. Abre **Authentication > Email Templates > Reset Password / Change Email**.
5. El cuerpo HTML debe incluir:

```html
<h2>Recupera tu PIN en Masushi</h2>
<p><a href="{{ .ConfirmationURL }}">Crear un nuevo PIN</a></p>
<p>Si no solicitaste este cambio, ignora este correo.</p>
```

Sin `{{ .ConfirmationURL }}`, Supabase puede enviar el correo, pero el mensaje no tendrá el enlace correcto. Si el botón usa solamente `{{ .SiteURL }}` o `{{ .RedirectTo }}`, abrirá el inicio de la web y nunca llegará a `/reset-password`.

También configura en Vercel `NEXT_PUBLIC_SITE_URL=https://www.masushi.cl`.

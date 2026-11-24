# Recuperación de PIN

## Estado de activación

La activación requiere la migración aditiva del limitador, la configuración server-side, la verificación de IP confiable y las pruebas descritas abajo. La compuerta del servidor debe permanecer cerrada en producción hasta completar las pruebas. No se modifican los datos de las cuentas existentes.

## Flujo implementado

1. `/forgot-password` envía el correo a `POST /api/auth/request-password-reset`.
2. El endpoint normaliza y valida el correo, exige el flag de código y el flag servidor, obtiene una IP confiable y consulta el limitador compartido. Toda indisponibilidad cierra el flujo sin generar ni enviar enlaces.
3. El servidor usa `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })`, toma `properties.hashed_token` y envía un único correo por SMTP mediante `src/utils/sendEmail.ts`. Solo recuperación exige TLS: puerto 587 exige STARTTLS y puerto 465 usa TLS implícito; ambos validan certificados. Los demás consumidores de `sendEmail` conservan la configuración previa.
4. No hay fallback al correo de Supabase: reenviar por dos mecanismos podría crear enlaces diferentes o causar envíos duplicados.
5. El enlace de producción apunta exclusivamente a `https://www.masushi.cl/reset-password`. En Preview apunta a la URL exacta de testing configurada en `PIN_RECOVERY_PREVIEW_URL`; no se deriva del navegador, `Host` ni de otras cabeceras. Ambos enlaces llevan `token_hash` y `type=recovery` en el fragmento URL. Antes de crear el cliente global, la aplicación retira los parámetros de recuperación de la barra y los guarda solo en memoria; evita así que el cliente global interprete errores de Supabase y borre la sesión existente. El usuario debe seleccionar «Validar enlace».
6. La página usa un cliente Supabase aislado, con almacenamiento solo en memoria, y `verifyOtp({ token_hash, type: 'recovery' })`. No utiliza la sesión del cliente global ni depende del PKCE verifier del navegador que solicitó el correo.
7. Solo después de validar el OTP, la página compara el UUID de la sesión de recuperación con el usuario validado y ejecuta `updateUser` con `ensureSupabasePassword(pin)`. Al éxito, limpia la sesión local aislada.

La identidad, el correo, los metadatos, perfiles, direcciones y pedidos existentes no se modifican. Supabase Auth actualiza únicamente la contraseña de la cuenta autenticada por su token de recuperación; no se recrean usuarios ni se requiere una migración de datos de usuarios. La limitación compartida depende de la migración aditiva descrita abajo.

## Archivos principales

- [request-password-reset.ts](src/pages/api/auth/request-password-reset.ts): validación, compuerta del servidor, limitación y respuesta genérica.
- [passwordResetRateLimit.ts](src/server/passwordResetRateLimit.ts): conecta el limitador PostgreSQL mediante la RPC administrativa.
- [passwordReset.ts](src/server/passwordReset.ts): generación de token hash y envío SMTP, sin fallback.
- [passwordRecovery.ts](src/utils/passwordRecovery.ts): creación y análisis del enlace, validación de correo y PIN.
- [forgot-password.tsx](src/pages/forgot-password.tsx): formulario solo si la compuerta de servidor está disponible.
- [reset-password.tsx](src/pages/reset-password.tsx): verificación OTP y actualización del PIN.
- [featureFlags.ts](src/utils/featureFlags.ts): flag de recuperación.

## Limitador compartido

La migración [20261113_password_reset_rate_limit.sql](migrations/20261113_password_reset_rate_limit.sql) crea una tabla independiente en el esquema `private` y una función RPC atómica en `public`. La tabla guarda solamente un tipo de bucket, un identificador HMAC-SHA256, inicio de ventana, contador y expiración. No contiene correo ni dirección IP en texto plano, no tiene claves foráneas, y no lee ni modifica datos de usuarios.

La función usa `SECURITY INVOKER` y `search_path` vacío. Adquiere advisory transaction locks para ambos identificadores en orden estable, revisa ambos límites y, solamente si ambos permiten, incrementa los dos contadores. La función es ejecutable solo por `service_role`; la tabla no se expone en Data API, tiene RLS habilitado, no tiene políticas para `anon`/`authenticated`, y los privilegios de tabla se conceden únicamente a `service_role`. Revisar también que `private` no esté añadido a los esquemas expuestos por la configuración de Supabase.

### Límites

- 3 solicitudes por correo normalizado por ventana.
- 20 solicitudes por IP por ventana.
- Ventana inicial propuesta de 3600 segundos, iniciada con la primera solicitud permitida de cada identificador.

El límite por email restringe solicitudes repetidas a una cuenta; el límite por IP puede afectar hogares, redes móviles, oficinas u otras redes compartidas con muchas personas. Usuarios móviles que cambian de IP pueden eludir el contador por IP, aunque siguen sujetos al límite por correo. Una ventana anclada evita que solicitudes de un correo alteren el contador de otro, pero quien llegue al límite debe esperar al vencimiento completo. Medir tráfico legítimo y ajustar los valores con aprobación; no se informa al usuario si fue limitado para evitar diferencias que ayuden a enumerar cuentas.

Tres solicitudes por email también permiten un bloqueo dirigido temporal de la recuperación de una cuenta. Antes de producción, medir el volumen legítimo en staging y considerar CAPTCHA/anti-bot previo al conteo, protección global del endpoint en el borde y una vía de soporte que no revele si una cuenta existe. Estas medidas aumentan el costo del abuso, pero no eliminan la denegación del servicio. No subir límites solo para reducir falsos positivos sin medir el abuso; no bajar el límite por IP sin considerar redes compartidas.

### Configuración server-side pendiente

El servidor exige todas estas variables; no se incluyen secretos en el repositorio:

- `PASSWORD_RESET_RATE_LIMIT_HMAC_SECRET`: secreto aleatorio dedicado, mínimo 32 bytes, solo server-side. No reutilizar claves Supabase/SMTP ni prefijar con `NEXT_PUBLIC_`.
- `PASSWORD_RESET_EMAIL_LIMIT`: entero configurado tras aprobar el umbral (propuesta: `3`).
- `PASSWORD_RESET_IP_LIMIT`: entero configurado tras aprobar el umbral (propuesta: `20`).
- `PASSWORD_RESET_RATE_WINDOW_SECONDS`: ventana aprobada en segundos (propuesta: `3600`).
- `PIN_RECOVERY_TRUST_VERCEL_IP=true`: solo después de comprobar en el deployment de prueba que Vercel establece/sobrescribe `x-real-ip` con la IP del cliente. El código exige además `VERCEL=1`, valida IPv4/IPv6 y no usa `x-forwarded-for`.
- `PIN_RECOVERY_PREVIEW_URL`: solo para `VERCEL_ENV=preview`; URL completa del callback aprobado, con ruta exacta `/reset-password`. Debe configurarse únicamente del lado servidor.
- `PIN_RECOVERY_PREVIEW_ALLOWED_HOST`: allowlist independiente con un único hostname exacto, sin esquema, puerto, ruta ni wildcard. No se debe configurar hasta verificar externamente la pertenencia al proyecto de Vercel y la protección de la rama.
- `VERCEL_BRANCH_URL`: hostname de la rama inyectado por Vercel. En Preview debe coincidir exactamente con `PIN_RECOVERY_PREVIEW_ALLOWED_HOST` y con el hostname de `PIN_RECOVERY_PREVIEW_URL`.

La URL de la rama debe estar asociada al proyecto y protegida por Vercel Authentication. Si no coincide con la allowlist y el hostname del callback, el flujo falla cerrado. Verificar la asociación y la protección antes de autorizar ese callback exacto, sin wildcard.

El resolver valida también `VERCEL=1` y `PIN_RECOVERY_SERVER_ENABLED=true`. `isPasswordResetRequestConfigured()` usa esa comprobación, así que las páginas/API quedan no configuradas si falta la allowlist, la URL de la rama o el flag server-side. La constante `PIN_RECOVERY_ENABLED` es una compuerta de código independiente.

Antes de probar, agregar a las Redirect URLs del proyecto Supabase autorizado solo el callback exacto de la rama protegida. No usar wildcard de dominios Preview. Cuando se utilice Supabase productivo, probar exclusivamente con cuentas ficticias autorizadas.

Si falta una variable, la IP no se puede validar, o PostgreSQL/RPC falla, el limitador responde como no disponible; la API devuelve un error temporal genérico y no genera ni envía correo. La clave HMAC se usa para los identificadores, nunca se envía a PostgreSQL y no se registra. Rotarla cambia los identificadores y restablece efectivamente los contadores; hacerlo solo con la recuperación deshabilitada y con aprobación.

### Limpieza de contadores

Cada llamada de limitación elimina registros expirados para los dos identificadores que procesa. Para filas expiradas de identificadores inactivos, la migración prepara `private.cleanup_password_reset_rate_limits(batch_size)`: borra como máximo 1000 filas por llamada, ordenadas por expiración, con `FOR UPDATE SKIP LOCKED`; no selecciona registros activos y llamadas concurrentes no esperan por las mismas filas. El índice por `expires_at` permite encontrar los candidatos sin escanear toda la tabla.

Frecuencia inicial a evaluar en staging: una llamada horaria con lote 500, midiendo duración, cantidad borrada y saldo de filas vencidas. Si se acumulan más de 500 filas vencidas por hora, aumentar frecuencia antes que el lote y validar la carga. No se añade cron ni se ejecuta la limpieza en esta fase.

El script [20261113_password_reset_rate_limit_cleanup_test.sql](migrations/tests/20261113_password_reset_rate_limit_cleanup_test.sql) verifica en una transacción reversible que el lote borra únicamente expiradas, respeta su tamaño y conserva activas. Ejecutarlo únicamente después de aplicar la migración en staging aislado. No usar datos de clientes ni programar cron en esta fase.

## Requisitos antes de habilitar

### Limitación compartida

Revisar y aprobar los límites; verificar permisos/RLS y que anon/authenticated no puedan invocar la función ni acceder a la tabla; validar concurrencia real contra PostgreSQL aislado. Aplicar la migración en producción solo después de identificar el proyecto, completar el preflight y obtener autorización específica. No usar memoria local como control serverless.

El código no confía en `x-forwarded-for` y falla cerrado hasta una validación controlada de `x-real-ip`. No configurar `PIN_RECOVERY_TRUST_VERCEL_IP` basándose únicamente en una suposición o en el hecho de que la app corre en Vercel.

La migración ejecuta un preflight que falla si encuentra la tabla o cualquier función con los nombres del limitador, e informa los esquemas y firmas existentes; utiliza `CREATE FUNCTION`, no `CREATE OR REPLACE`. Si `private` ya existe, no cambia sus permisos: se detiene si `service_role` no tiene `USAGE`. Solo crea el esquema y concede `USAGE` cuando el esquema aún no existe. La consulta de solo lectura [20261113_password_reset_rate_limit_preflight.sql](migrations/tests/20261113_password_reset_rate_limit_preflight.sql) permite revisar relaciones, firmas y `USAGE` en el proyecto confirmado antes de solicitar autorización para aplicar la migración.

En staging, ejecutar además [20261113_password_reset_rate_limit_window_test.sql](migrations/tests/20261113_password_reset_rate_limit_window_test.sql) con privilegios de propietario y únicamente dentro de la base aislada. El script usa identificadores sintéticos y revierte sus filas. Comprueba el límite por email, que un rechazo no incremente el bucket IP, expiración e inicio de una ventana nueva, y parámetros inválidos sin cambio parcial. Para verificar específicamente una solicitud que espera un advisory lock mientras vence su ventana, ejecutar dos conexiones coordinadas: una conexión de staging debe adquirir antes los advisory locks de los identificadores sintéticos y mantenerlos hasta que venza una fila ya limitada; invocar la RPC desde la segunda conexión antes del vencimiento, confirmar que queda esperando, liberar la primera conexión y verificar que la RPC permite la solicitud y reinicia ambos contadores según la ventana vigente. No ejecutar este procedimiento contra producción.

### Supabase y correo

- Revisar en Supabase Auth el dominio y los ajustes de OTP/expiración vigentes; el texto del correo no promete un tiempo exacto, ya que el tiempo real lo controla Supabase.
- Confirmar en Supabase que las Redirect URLs permitidas incluyen el callback exacto de ese entorno. Producción usa `https://www.masushi.cl/reset-password`; Preview usa únicamente `PIN_RECOVERY_PREVIEW_URL` del testing aprobado.
- Mantener `SUPABASE_SERVICE_ROLE_KEY` y las credenciales SMTP solo en variables server-side. No usar prefijo `NEXT_PUBLIC_` ni imprimirlas en logs.
- El correo se envía únicamente por el SMTP configurado. Para recuperación, usar `SMTP_PORT` 587 (STARTTLS obligatorio) o 465 (TLS implícito); ambos requieren certificado válido. Si TLS falla, se cancela el envío sin fallback a Supabase.
- `sendEmail` también envía códigos asociados a pedidos, activación de gift cards, bienvenida y verificación. Solo el flujo de recuperación activa la opción TLS estricta; los demás consumidores conservan la configuración previa.
- Los errores del envío de recuperación se convierten en errores genéricos en el servidor; no se registran enlaces, tokens ni credenciales.
- El cliente de recuperación necesita las variables públicas de Supabase habituales (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Flags

La interfaz requiere `PIN_RECOVERY_ENABLED=true`; la API también exige ese flag y `PIN_RECOVERY_SERVER_ENABLED=true`. Las páginas solo muestran los formularios si la configuración completa del limitador está presente. Cambiar flags no sustituye la migración, la configuración ni la validación de IP.

El cambio de PIN desde perfil conserva su flag independiente `PASSWORD_RECOVERY_ENABLED=false` y no se activa al habilitar la recuperación.

## Pruebas y despliegue

Las pruebas unitarias de formato, configuración, HMAC, IP confiable, decisiones concurrentes simuladas, fail-closed, respuestas genéricas y ausencia de envío en rechazos se ejecutan con `npm test`. Las pruebas concurrentes unitarias usan un RPC simulado; no sustituyen una prueba de concurrencia real en una base aislada. Antes de habilitar en producción, hacer pruebas de integración solo con cuentas independientes de testing: mismo y distinto dispositivo, token válido/expirado/reutilizado, sesión normal, PIN nuevo y login posterior. Comparar UUID, correo, metadatos, perfil y pedidos de la cuenta de prueba antes/después; comprobar otra cuenta de prueba no afectada. No probar con clientes reales.

Antes de publicar, verificar en Vercel el proyecto asociado al dominio, rama de producción, commit del deployment activo, configuración de build y disponibilidad de las páginas y API. No asumir que `origin/main` es la rama desplegada. Publicar primero con los flags desactivados; solo habilitar después de confirmar el limitador, Supabase, el envío SMTP y la matriz de pruebas.

Preparar la integración desde la versión que realmente sirve producción, revisar su diff y validar las sesiones, pedidos y direcciones usando solo cuentas de prueba. No reescribir la historia de `main` ni publicar cambios ajenos. Los cambios de recuperación no deben incluir escrituras masivas ni afectar el flujo de pedidos.

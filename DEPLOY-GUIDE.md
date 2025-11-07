# 🚀 Guía de Deployment - Masushi App

Esta guía te ayudará a subir los cambios al repositorio y configurar las variables de entorno en Vercel.

## 📋 Checklist Pre-Deployment

### ✅ Archivos Modificados Recientemente:
- `src/pages/api/orders.ts` - Template de WhatsApp actualizado
- `src/pages/api/admin/test-whatsapp.ts` - Tests actualizados
- `src/pages/api/test/trigger-order-notification.ts` - Tests actualizados
- `src/pages/checkout.tsx` - Modal de confirmación mejorado
- `src/utils/estimateTimes.ts` - Sistema de tiempos de entrega
- `scripts/manage-users.sql` - Script de gestión de usuarios
- `scripts/delete-all-users.sql` - Script de limpieza masiva

---

## 🔐 Paso 1: Variables de Entorno en Vercel

Debes agregar estas variables de entorno en tu proyecto de Vercel:

### **1. Ir a Vercel Dashboard**
1. Abre [https://vercel.com](https://vercel.com)
2. Selecciona tu proyecto `MasushiApp`
3. Ve a **Settings** → **Environment Variables**

### **2. Agregar Variables (una por una)**

#### **Mapbox (Públicas)**
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoicHVscGZpY3Rpb24iLCJhIjoiY21lNmdiaGMyMTR6MTJtcHpudmhidmxjZyJ9.kAB0xAK2lBEKMkGhVzDtcA
```

#### **JWT Secret (Privada)**
```
JWT_SECRET=KOToEkXppt3oquPxDE9yU4+UOk83AhuE6Rscq6bovciwEzkZu16vmSomfdNgqOyBQTa4w2YmPwLAS7YfgVwPhQ==
```

#### **Supabase (Públicas)**
```
NEXT_PUBLIC_SUPABASE_URL=https://kvsygskfoclasrhgxpul.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c3lnc2tmb2NsYXNyaGd4cHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTU3MzcsImV4cCI6MjA3MzUzMTczN30.OFTMep-WcQ5ynq8C6ulHRtZ8eIUFF5yDLUrZe-T1pJg
```

#### **Supabase (Privadas - Service Role)**
```
SUPABASE_URL=https://kvsygskfoclasrhgxpul.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c3lnc2tmb2NsYXNyaGd4cHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1NTczNywiZXhwIjoyMDczNTMxNzM3fQ.BQM1RbLKAknb1pTtdm2aDbd3WRUPCiCkILsX22i2GDE
```

#### **WhatsApp (Privadas)**
```
WHATSAPP_API_URL=https://graph.facebook.com/v16.0/860006433861553/messages
WHATSAPP_TOKEN=EAAZApZAYHKmFIBPZCDu9KIlxQu5n9eZCtYz6mnyJXAX10o50mElIuTa4kUlNtgnyMPd4x5uFq0fIZB8ks3Mgl5UFibYhFbAzw3ZCOf4WWwXzaWTdX7a4yvF8u7E21ETloK50ZBOMTb6DaqoBOegOOshQOPovKuaz9kgaiVZAKzpFFjyPbLLxB2ZBMivflD2oWcQZDZD
WHATSAPP_TEMPLATE_NAME=confirmacion_cliente
WHATSAPP_TEMPLATE_LANG=es_CL
WHATSAPP_TEMPLATE_HEADER_LINK=https://www.masushi.cl/images/FotoMensajeWsp.png
WHATSAPP_WEBHOOK_VERIFY_TOKEN=masushi-verify-2025
LOCAL_WHATSAPP_TEMPLATE=nuevo_pedido_local
LOCAL_WHATSAPP_NUMBER=56951869402
```

### **⚠️ IMPORTANTE: Actualizar Template Name**
La variable más importante a cambiar:
```
WHATSAPP_TEMPLATE_NAME=confirmacion_cliente
```
(Ya no es `confirmacion_orden`, ahora es `confirmacion_cliente`)

### **3. Configurar Ambientes**
Para cada variable, selecciona los ambientes donde aplica:
- ✅ **Production** - Siempre
- ✅ **Preview** - Opcional (recomendado para testing)
- ✅ **Development** - Opcional (solo si usas `vercel dev`)

---

## 📤 Paso 2: Subir Cambios al Repositorio

### **Opción A: Desde la Terminal (Recomendado)**

```powershell
# 1. Ver qué archivos cambiaron
git status

# 2. Agregar todos los cambios
git add .

# 3. Crear commit con mensaje descriptivo
git commit -m "feat: actualizar template WhatsApp y mejorar modal de confirmación

- Cambiar template de confirmacion_orden a confirmacion_cliente
- Actualizar formato de mensaje con rango de tiempo estimado
- Mejorar diseño del modal de confirmación (fondo oscuro, colores verde/rojo)
- Agregar scripts de gestión de usuarios
- Actualizar validaciones de direcciones"

# 4. Subir al repositorio remoto
git push origin main
```

### **Opción B: Desde GitHub Desktop**

1. Abre **GitHub Desktop**
2. Verás todos los archivos modificados en el panel izquierdo
3. Revisa los cambios (panel derecho)
4. Escribe un mensaje de commit descriptivo
5. Click en **Commit to main**
6. Click en **Push origin**

---

## 📝 Paso 3: Actualizar Template en WhatsApp Business

**⚠️ CRÍTICO:** Debes crear/actualizar el template en WhatsApp Business Manager:

### **Ir a Meta Business Manager**
1. [https://business.facebook.com](https://business.facebook.com)
2. Selecciona tu cuenta de WhatsApp Business
3. Ve a **Message Templates**
4. Busca o crea template llamado: `confirmacion_cliente`

### **Template Body:**
```
¡Hola {{1}}! 

Tu pedido #{{2}} ha sido recibido exitosamente y ya está en preparación. 🍣

Hora estimada de entrega: {{3}} (el tiempo de espera puede variar según la demanda)
Dirección: {{4}}
```

### **Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Número de pedido
3. `{{3}}` - Rango de hora (ej: "14:00 - 14:40")
4. `{{4}}` - Dirección

### **Configuración:**
- **Categoría**: UTILITY (o la que aplique)
- **Idioma**: Spanish (es_CL)
- **Header** (opcional): Imagen
  - URL: `https://www.masushi.cl/images/FotoMensajeWsp.png`

### **Enviar a Aprobación:**
1. Click en **Submit for Review**
2. Espera aprobación de WhatsApp (puede tardar 1-24 horas)
3. Una vez aprobado, el template estará activo

---

## 📡 Paso 4: Configurar Webhook de WhatsApp

### **¿Qué es el Webhook?**
El webhook permite que tu aplicación reciba notificaciones en tiempo real cuando:
- Un cliente envía un mensaje
- Un mensaje cambia de estado (enviado, entregado, leído)

### **Configurar en Meta for Developers:**

1. **Ir a Meta for Developers**
   - [https://developers.facebook.com](https://developers.facebook.com)
   - Selecciona tu App de WhatsApp Business

2. **Ir a WhatsApp → Configuration**
   - En el menú lateral, click en **WhatsApp**
   - Click en **Configuration**

3. **Editar Webhook**
   - En la sección **Webhook**, click en **Edit**

4. **Configurar URL y Token:**

   **Callback URL:**
   ```
   https://www.masushi.cl/api/webhooks/whatsapp
   ```

   **Verify Token:**
   ```
   masushi-verify-2025
   ```
   ⚠️ Este token debe coincidir exactamente con `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Vercel

5. **Click en "Verify and Save"**
   - Meta enviará una petición GET a tu endpoint
   - Si todo está correcto, dirá "Success"

6. **Suscribirse a Eventos (Webhook Fields):**
   
   Marca estas opciones:
   - ✅ **messages** - Mensajes entrantes
   - ✅ **message_status** - Estados de mensajes (opcional pero recomendado)

7. **Guardar Cambios**

### **Verificar que Funciona:**

Puedes probar el webhook manualmente:

```powershell
# Test desde PowerShell (reemplaza TU_VERIFY_TOKEN)
Invoke-WebRequest -Uri "https://www.masushi.cl/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=masushi-verify-2025&hub.challenge=TEST123"
```

Debería devolver: `TEST123`

### **Troubleshooting Webhook:**

**Error: "Callback verification failed"**
- Verifica que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` esté configurado en Vercel
- Verifica que la URL sea exactamente: `https://www.masushi.cl/api/webhooks/whatsapp`
- Verifica que el token coincida exactamente (case-sensitive)

**Error: "URL timed out"**
- Verifica que tu app esté deployed y funcionando
- Prueba abrir `https://www.masushi.cl` en el navegador

---

## 🧪 Paso 5: Testing Post-Deployment

### **1. Verificar Deployment en Vercel**
1. Ve a [https://vercel.com](https://vercel.com)
2. Verás el deployment en progreso
3. Espera a que diga "Ready" (2-5 minutos)
4. Click en **Visit** para abrir tu app

### **2. Verificar Variables de Entorno**
```powershell
# En tu terminal local, probar la API:
curl https://tu-app.vercel.app/api/status
```

### **3. Hacer un Pedido de Prueba**
1. Abre tu app en el navegador
2. Agrega productos al carrito
3. Ve a checkout
4. Completa la información
5. Haz un pedido de prueba
6. Verifica que llegue el mensaje de WhatsApp con el nuevo formato

### **4. Verificar el Modal de Confirmación**
- Debe aparecer en fondo oscuro
- Círculo verde con check
- Texto: "Te llegará un mensaje automático de WhatsApp con el tiempo estimado de entrega"
- Botón rojo "Entendido"

---

## 🔍 Troubleshooting

### **Error: Template no encontrado**
```json
{
  "error": {
    "message": "(#132001) Template name does not exist in the translation"
  }
}
```

**Solución:**
1. Verifica que el template `confirmacion_cliente` esté **aprobado** en WhatsApp Business
2. Verifica que `WHATSAPP_TEMPLATE_NAME=confirmacion_cliente` en Vercel
3. Re-deploy después de actualizar variables

### **Error: Variables de entorno no funcionan**
**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que todas estén configuradas
3. **Importante:** Después de agregar/modificar variables, debes hacer **Redeploy**
4. Ve a Deployments → Click en el último → Three dots → Redeploy

### **El modal se ve mal**
**Solución:**
1. Limpia caché del navegador (Ctrl + Shift + R)
2. Verifica que el deployment haya terminado correctamente

---

## 📋 Checklist Final

Antes de considerar el deployment completo, verifica:

- [ ] ✅ Todas las variables de entorno agregadas en Vercel
- [ ] ✅ Template `confirmacion_cliente` creado y **aprobado** en WhatsApp Business
- [ ] ✅ Código subido al repositorio (git push)
- [ ] ✅ Deployment completado en Vercel (status: Ready)
- [ ] ✅ Pedido de prueba realizado exitosamente
- [ ] ✅ Mensaje de WhatsApp recibido con nuevo formato
- [ ] ✅ Modal de confirmación funciona correctamente

---

## 🎯 Comandos Rápidos

### **Ver cambios sin commitear:**
```powershell
git status
git diff
```

### **Subir cambios:**
```powershell
git add .
git commit -m "tu mensaje"
git push origin main
```

### **Ver último commit:**
```powershell
git log -1
```

### **Verificar variables locales:**
```powershell
cat .env.local | Select-String "WHATSAPP_TEMPLATE_NAME"
```

---

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [WhatsApp Business Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

**🎉 ¡Listo! Una vez completados todos los pasos, tu aplicación estará actualizada y funcionando en producción.**

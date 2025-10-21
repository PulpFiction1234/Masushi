# 🐛 Bug Fix: Repetir Pedido - Productos sin Imagen

## Problema Identificado

Al hacer click en "Repetir pedido", los productos aparecían en el carrito sin imagen y mostraba el error: **"No se pudo agregar ningún producto al carrito"**.

---

## 🔍 Causa Raíz

El problema estaba en cómo se guardaba el **código del producto** al crear un pedido:

### Código Problemático (checkout.tsx):
```typescript
const orderItems = cartTyped.map((it) => ({
  codigo: codePartOf(it),  // ❌ PROBLEMA AQUÍ
  cantidad: it.cantidad,
  opcion: (it as any).opcion || undefined,
}));
```

### ¿Qué hacía `codePartOf()`?
```typescript
export const codePartOf = (item: CartItemLike) =>
  item.codigo ? `${item.codigo} | ` : "";
```

**Resultado**: Si el producto tenía código `"001"`, se guardaba como `"001 | "` (con pipe y espacios).

### Al repetir el pedido:
```typescript
const productoData = getProductByCode("001 | ");  // ❌ NO ENCONTRADO
```

La función buscaba un producto con código `"001 | "` pero en el catálogo el código es `"001"` → **No encontrado** → **No se podía agregar al carrito**.

---

## ✅ Solución Implementada

### 1. **Corregir el guardado de código** (checkout.tsx)
```typescript
const orderItems = cartTyped.map((it) => ({
  codigo: it.codigo || String(it.id), // ✅ Guardar código limpio
  cantidad: it.cantidad,
  opcion: (it as any).opcion || undefined,
}));
```

Ahora guarda: `"001"` (sin pipe ni espacios)

### 2. **Hacer búsqueda tolerante** (productLookup.ts)
```typescript
export function getProductByCode(codigo: string) {
  // Limpiar el código de espacios y pipes por retrocompatibilidad
  const codigoLimpio = codigo.replace(/\s*\|\s*$/, '').trim();
  
  const producto = productos.find((p) => p.codigo === codigoLimpio);
  return producto;
}
```

Ahora funciona con:
- ✅ `"001"` → Encuentra el producto
- ✅ `"001 | "` → Limpia y encuentra el producto (pedidos antiguos)
- ✅ `" 001 "` → Limpia y encuentra el producto

### 3. **Agregar logging extensivo**
```typescript
// En profile.tsx
console.log('[RepeatOrder] Iniciando repetir pedido:', order);
console.log('[RepeatOrder] Procesando item:', item);
console.log('[RepeatOrder] Producto encontrado:', productoData);

// En productLookup.ts
console.log(`[getProductByCode] Buscando: "${codigo}" (limpio: "${codigoLimpio}")`);
```

Esto ayuda a identificar problemas futuros rápidamente.

### 4. **Manejo gracioso de imágenes** (CarritoPanel.tsx)
```typescript
{item.imagen ? (
  <Image src={item.imagen} alt={item.nombre} ... />
) : (
  <div className="w-12 h-12 bg-gray-700 rounded">
    <span className="text-xs">Sin img</span>
  </div>
)}
```

Si falta la imagen, muestra un placeholder en lugar de romper.

### 5. **Mejor conversión de StaticImageData** (CartContext.tsx)
```typescript
const imagen = typeof prod.imagen === "string" 
  ? prod.imagen 
  : (prod.imagen as StaticImageData)?.src || "";

if (!imagen) {
  console.warn(`[CartContext] Producto ${prod.nombre} sin imagen`, prod);
}
```

Maneja correctamente imágenes de Next.js y strings.

---

## 📊 Comparación

### ANTES (con bug):
```json
// En la base de datos
{
  "codigo": "001 | ",
  "cantidad": 2
}

// Al repetir pedido
getProductByCode("001 | ")  // ❌ No encuentra
// Resultado: "No se pudo agregar ningún producto"
```

### AHORA (corregido):
```json
// En la base de datos
{
  "codigo": "001",
  "cantidad": 2
}

// Al repetir pedido
getProductByCode("001")  // ✅ Encuentra
// Resultado: "2 producto(s) agregado(s) al carrito"
```

---

## 🧪 Cómo Probar

1. **Haz un nuevo pedido** (después de este fix)
2. **Ve a tu perfil**
3. **Click en "Repetir pedido"**
4. **Abre la consola del navegador** (F12)
5. **Verifica los logs**:
   ```
   [RepeatOrder] Iniciando repetir pedido: {...}
   [getProductByCode] Buscando producto con código: "001" (limpio: "001")
   [getProductByCode] ✅ Encontrado: Acevichado Roll
   [RepeatOrder] ✅ Producto agregado exitosamente
   ```
6. **Abre el carrito** → Los productos deben tener imagen

---

## 🔄 Retrocompatibilidad

Los pedidos guardados con el formato antiguo (`"001 | "`) seguirán funcionando gracias a la limpieza del código en `getProductByCode`:

```typescript
// Pedido antiguo con "001 | "
getProductByCode("001 | ")
  → Limpia a "001"
  → Encuentra el producto
  → ✅ Funciona
```

---

## 🎯 Impacto

- ✅ **Nuevos pedidos**: Se guardan correctamente (código limpio)
- ✅ **Pedidos antiguos**: Siguen funcionando (limpieza automática)
- ✅ **Repetir pedido**: Ahora funciona correctamente
- ✅ **Imágenes**: Se muestran correctamente en el carrito
- ✅ **Debugging**: Logs completos para identificar problemas

---

## 📝 Archivos Modificados

1. ✅ `src/pages/checkout.tsx` - Guardar código limpio
2. ✅ `src/utils/productLookup.ts` - Búsqueda tolerante con limpieza
3. ✅ `src/pages/profile.tsx` - Logging extensivo y mejor manejo de errores
4. ✅ `src/components/CarritoPanel.tsx` - Placeholder para imágenes faltantes
5. ✅ `src/context/CartContext.tsx` - Mejor conversión de StaticImageData

---

## ⚠️ Nota para Migración

Si tienes pedidos existentes con el formato antiguo en la base de datos, **NO necesitas migrar nada**. El código ahora es retrocompatible y limpia automáticamente los códigos al buscar productos.

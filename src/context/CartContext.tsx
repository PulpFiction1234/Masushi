// context/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Producto } from "@/data/productos";

export type CartOpcion = { id: string; label: string };

export type CartItem = {
  cartKey: string;   // prodId + opcionId (p.ej., "210:2pollo")
  id: number;
  codigo?: string;   // guardar el código del producto
  nombre: string;
  imagen: string;
  precioUnit: number;
  cantidad: number;
  opcion?: CartOpcion; // para mostrar "Tipo: ..."
};

type CartContextType = {
  cart: CartItem[];
  total: number;
  addToCart: (prod: Producto, opts?: { opcion?: CartOpcion; precioUnit?: number }) => void;
  updateQuantity: (cartKey: string, cantidad: number) => void;
  removeFromCart: (cartKey: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// === Persistencia ===
const STORAGE_KEY = "mazushi_cart_v1";

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Acepta {items: CartItem[]} o CartItem[] por compatibilidad
    const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    if (!Array.isArray(items)) return [];
    // Validación mínima
    return items.filter(
      (it) =>
        typeof it?.cartKey === "string" &&
        typeof it?.id === "number" &&
        typeof it?.nombre === "string" &&
        typeof it?.precioUnit === "number" &&
        typeof it?.cantidad === "number"
    );
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, updatedAt: Date.now() }));
  } catch {
    // almacenamiento lleno o bloqueado -> ignorar
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito al montar
  useEffect(() => {
    setCart(loadCartFromStorage());
  }, []);

  // Guardar en storage cuando cambie
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // Sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      try {
        const parsed = JSON.parse(e.newValue);
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        setCart(items);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = useMemo(
    () => cart.reduce((acc, it) => acc + it.precioUnit * it.cantidad, 0),
    [cart]
  );

  const addToCart: CartContextType["addToCart"] = (prod, opts) => {
    const precioUnit = typeof opts?.precioUnit === "number" ? opts.precioUnit : prod.valor;
    const opcion = opts?.opcion;
    const cartKey = `${prod.id}:${opcion?.id ?? "base"}`;

    setCart((prev) => {
      const idx = prev.findIndex((it) => it.cartKey === cartKey);
      if (idx >= 0) {
        const copy = [...prev];
        // suma cantidad y (opcional) actualiza precioUnit por si cambió
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1, precioUnit };
        return copy;
      }
      return [
        ...prev,
        {
          cartKey,
          id: prod.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          imagen: prod.imagen,
          precioUnit,
          cantidad: 1,
          opcion,
        },
      ];
    });
  };

  const updateQuantity: CartContextType["updateQuantity"] = (cartKey, cantidad) => {
    setCart((prev) =>
      prev
        .map((it) =>
          it.cartKey === cartKey ? { ...it, cantidad: Math.max(0, Math.floor(cantidad)) } : it
        )
        .filter((it) => it.cantidad > 0)
    );
  };

  const removeFromCart: CartContextType["removeFromCart"] = (cartKey) => {
    setCart((prev) => prev.filter((it) => it.cartKey !== cartKey));
  };

  const clearCart: CartContextType["clearCart"] = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, total, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

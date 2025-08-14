// context/CartContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Producto } from "@/data/productos";

export type CartOpcion = { id: string; label: string };

export type CartItem = {
  cartKey: string;   // prodId + opcionId (p.ej., "210:2pollo")
  id: number;
  codigo?: string;   // ← NUEVO: guardar el código del producto
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

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
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          cartKey,
          id: prod.id,
          codigo: prod.codigo, // ← NUEVO: se guarda aquí
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
        .map((it) => (it.cartKey === cartKey ? { ...it, cantidad: Math.max(1, cantidad) } : it))
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

// src/context/CartContext.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  id: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  valor: number;
  imagen?: string;
  cantidad: number;
};

type AddPayload = Omit<CartItem, "cantidad">;

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: AddPayload) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, cantidad: number) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: AddPayload) => {
    setCart(prev => {
      const ex = prev.find(p => p.id === item.id);
      if (ex) {
        return prev.map(p => p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(p => p.id !== id));

  const updateQuantity = (id: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(p => p.id === id ? { ...p, cantidad } : p));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((s, it) => s + it.valor * it.cantidad, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

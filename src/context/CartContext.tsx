"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { Producto } from "@/data/productos";

export type CartOpcion = { id: string; label: string };

export type CartItem = {
  cartKey: string;   // prodId + opcionId (p.ej., "210:2pollo")
  id: number;
  codigo?: string;
  nombre: string;
  imagen: string;
  blurDataUrl?: string;
  precioUnit: number;
  cantidad: number;
  opcion?: CartOpcion;
};

// === Acciones ===
export const ADD_ITEM = "ADD_ITEM";
export const UPDATE_QUANTITY = "UPDATE_QUANTITY";
export const REMOVE_ITEM = "REMOVE_ITEM";
export const CLEAR_CART = "CLEAR_CART";
export const SET_CART = "SET_CART";

export type CartAction =
  | {
      type: typeof ADD_ITEM;
      payload: { prod: Producto; opcion?: CartOpcion; precioUnit: number };
    }
  | { type: typeof UPDATE_QUANTITY; payload: { cartKey: string; cantidad: number } }
  | { type: typeof REMOVE_ITEM; payload: { cartKey: string } }
  | { type: typeof CLEAR_CART }
  | { type: typeof SET_CART; payload: CartItem[] };

type CartContextType = {
  cart: CartItem[];
  total: number;
  ready: boolean; // ← NUEVO: indica si ya hidratamos desde storage
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
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    if (!Array.isArray(items)) return [];
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
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, updatedAt: Date.now() }));
  } catch {
    // almacenamiento lleno o bloqueado -> ignorar
  }
}

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case ADD_ITEM: {
      const { prod, opcion, precioUnit } = action.payload;
      const cartKey = `${prod.id}:${opcion?.id ?? "base"}`;
      const idx = state.findIndex((it) => it.cartKey === cartKey);
      if (idx >= 0) {
        const copy = [...state];
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad + 1,
          precioUnit,
        };
        return copy;
      }
     const imagen = typeof prod.imagen === "string" ? prod.imagen : prod.imagen.src;
      const blurDataUrl =
        prod.blurDataUrl ??
        (typeof prod.imagen === "object" ? prod.imagen.blurDataURL : undefined);
      return [
        ...state,
        {
          cartKey,
          id: prod.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          imagen,
          blurDataUrl,
          precioUnit,
          cantidad: 1,
          opcion,
        },
      ];
    }
    case UPDATE_QUANTITY: {
      const { cartKey, cantidad } = action.payload;
      return state
        .map((it) =>
          it.cartKey === cartKey ? { ...it, cantidad: Math.max(0, Math.floor(cantidad)) } : it
        )
        .filter((it) => it.cantidad > 0);
    }
    case REMOVE_ITEM:
      return state.filter((it) => it.cartKey !== action.payload.cartKey);
    case CLEAR_CART:
      return [];
    case SET_CART:
      return action.payload;
    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ⚠️ Inicializamos SIEMPRE vacío para que SSR y primer render del cliente coincidan
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [ready, setReady] = useState(false);

  // Hidratar desde localStorage **después** del mount
  useEffect(() => {
    const items = loadCartFromStorage();
    if (items.length) {
      dispatch({ type: SET_CART, payload: items });
    }
    setReady(true);
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
        dispatch({ type: SET_CART, payload: items });
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = useMemo(
    () => cart.reduce((acc, it) => acc + it.precioUnit * it.cantidad, 0),
    [cart]
  );

  const addToCart = useCallback<CartContextType["addToCart"]>(
    (prod, opts) => {
      const precioUnit = typeof opts?.precioUnit === "number" ? opts.precioUnit : prod.valor;
      const opcion = opts?.opcion;
      dispatch({ type: ADD_ITEM, payload: { prod, opcion, precioUnit } });
    },
    []
  );

  const updateQuantity = useCallback<CartContextType["updateQuantity"]>(
    (cartKey, cantidad) => {
      dispatch({ type: UPDATE_QUANTITY, payload: { cartKey, cantidad } });
    },
    []
  );

  const removeFromCart = useCallback<CartContextType["removeFromCart"]>(
    (cartKey) => {
      dispatch({ type: REMOVE_ITEM, payload: { cartKey } });
    },
    []
  );

  const clearCart = useCallback<CartContextType["clearCart"]>(
    () => dispatch({ type: CLEAR_CART }),
    []
  );

  const value = useMemo(
    () => ({ cart, total, ready, addToCart, updateQuantity, removeFromCart, clearCart }),
    [cart, total, ready, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

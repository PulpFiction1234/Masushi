"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { StaticImageData } from "next/image";
import type { Producto } from "@/data/productos";

export type CartOpcion = { id: string; label: string };

export type CartItem = {
  cartKey: string; // prodId + opcionId (p.ej., "210:2pollo")
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
  ready: boolean; // indica si ya hidratamos desde storage
  addToCart: (prod: Producto, opts?: { opcion?: CartOpcion; precioUnit?: number }) => void;
  updateQuantity: (cartKey: string, cantidad: number) => void;
  removeFromCart: (cartKey: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// === Persistencia ===
const STORAGE_KEY = "mazushi_cart_v1";

function loadCartFromStorage(): { items: CartItem[]; updatedAt: number } {
  try {
    if (typeof window === "undefined") return { items: [], updatedAt: 0 };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], updatedAt: 0 };
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    const safe: CartItem[] = items.filter(
      (it: any) =>
        typeof it?.cartKey === "string" &&
        typeof it?.id === "number" &&
        typeof it?.nombre === "string" &&
        typeof it?.precioUnit === "number" &&
        typeof it?.cantidad === "number"
    );
    return { items: safe, updatedAt: typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0 };
  } catch {
    return { items: [], updatedAt: 0 };
  }
}

function saveCartToStorage(items: CartItem[]): number {
  try {
    if (typeof window === "undefined") return 0;
    const updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, updatedAt }));
    return updatedAt;
  } catch {
    // almacenamiento lleno o bloqueado -> ignorar
    return 0;
  }
}

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  // Normaliza ids para evitar duplicados por mayúsculas/acentos/espacios
  function normId(s?: string | null) {
    return (s ?? "base")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, ""); // quita acentos
  }

  switch (action.type) {
    case ADD_ITEM: {
      const { prod, opcion, precioUnit } = action.payload;
      const cartKey = `${prod.id}:${normId(opcion?.id)}`;

      const idx = state.findIndex((it) => it.cartKey === cartKey);
      if (idx >= 0) {
        const copy = [...state];
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad + 1,
        };
        return copy;
      }

      const imagen =
        typeof prod.imagen === "string" ? prod.imagen : (prod.imagen as StaticImageData).src;
      const blurDataUrl =
        prod.blurDataUrl ??
        (typeof prod.imagen === "object"
          ? (prod.imagen as StaticImageData).blurDataURL
          : undefined);

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
  // Inicializamos vacío para que SSR y primer render del cliente coincidan
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [ready, setReady] = useState(false);
  // reloj local para comparar versiones entre pestañas
  const lastSavedAtRef = useRef(0);

  // Hidratar desde localStorage DESPUÉS del mount
  useEffect(() => {
    const { items, updatedAt } = loadCartFromStorage();
    if (items.length) {
      dispatch({ type: SET_CART, payload: items });
    }
    lastSavedAtRef.current = updatedAt;
    setReady(true);
  }, []);

  // Guardar en storage cuando cambie, SOLO si ya hidratamos
  useEffect(() => {
    if (!ready) return;
    lastSavedAtRef.current = saveCartToStorage(cart);
  }, [cart, ready]);

  // Sincronizar entre pestañas: ignorar estados viejos
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      try {
        const parsed = JSON.parse(e.newValue);
        const items: CartItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
        const updatedAt: number = typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0;

        // Si llega una versión más vieja o igual a la ya aplicada, ignorar
        if (updatedAt <= lastSavedAtRef.current) return;

        lastSavedAtRef.current = updatedAt;
        dispatch({ type: SET_CART, payload: items });
      } catch {
        // ignorar
      }
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

  const clearCart = useCallback<CartContextType["clearCart"]>(() => {
    dispatch({ type: CLEAR_CART });
  }, []);

  const value = useMemo(
    () => ({ cart, total, ready, addToCart, updateQuantity, removeFromCart, clearCart }),
    [cart, total, ready, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

import {
  fmt,
  priceOf,
  keyOf,
  nameWithTipo,
  CartItemLike,
  CheckoutState,
  CheckoutAction,
} from "@/utils/checkout";
import React from "react";

const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

interface Props {
  cart: CartItemLike[];
  state: CheckoutState; // se mantiene por compatibilidad
  dispatch: React.Dispatch<CheckoutAction>; // se mantiene por compatibilidad
  subtotalProductos: number;
  deliveryType: "retiro" | "delivery";
  deliveryFee: number;
}

export default function SummaryPanel({
  cart,
  state: _state,         // no se usan (compatibilidad)
  dispatch: _dispatch,    // no se usan (compatibilidad)
  subtotalProductos,
  deliveryType,
  deliveryFee,
}: Props) {
  return (
    <div className={`${card} p-4 bg-neutral-900`}>
      <h3 className="font-bold mb-3 text-neutral-50">Tu carrito</h3>

      <div className="space-y-1">
        {cart.map((item) => (
          <div
            key={keyOf(item)}
            className="text-sm text-neutral-200 flex items-center justify-between"
          >
            <span>
              {nameWithTipo(item)}{" "}
              <span className="text-neutral-400">(x{item.cantidad})</span>
            </span>
            <span className="font-mono">{fmt(priceOf(item) * item.cantidad)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
        <p className="text-sm text-neutral-300">Subtotal productos</p>
        <p className="font-semibold">{fmt(subtotalProductos)}</p>
      </div>

      <p className="text-xs text-neutral-400 mt-3">
        Incluye <span className="font-medium text-neutral-200">salsas gratis (soya/teriyaki) según tu pedido</span>,
        además <span className="font-medium text-neutral-200">1 jengibre y 1 wasabi sin costo</span>. 
        Si necesitas más, agrégalos en la sección de <span className="font-medium">Extras</span>.
      </p>

      {deliveryType === "delivery" && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-300">Delivery</span>
          <span className="font-semibold">{fmt(deliveryFee)}</span>
        </div>
      )}
    </div>
  );
}

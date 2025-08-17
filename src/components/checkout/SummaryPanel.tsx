import {
  fmt,
  priceOf,
  keyOf,
  nameWithTipo,
  CartItemLike,
  CheckoutState,
  CheckoutAction,
  PRECIO_SOYA_EXTRA,
  PRECIO_TERIYAKI_EXTRA,
} from "@/utils/checkout";
import ExtrasSelector from "./ExtrasSelector";
import React from "react";

const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

interface Props {
  cart: CartItemLike[];
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  subtotalProductos: number;
  deliveryType: "retiro" | "delivery";
  deliveryFee: number;
}

export default function SummaryPanel({
  cart,
  state,
  dispatch,
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
        Incluye <span className="font-medium text-neutral-200">1 salsa (soya o teriyaki) por producto</span>. Extras: Soya {fmt(PRECIO_SOYA_EXTRA)}, Teriyaki {fmt(PRECIO_TERIYAKI_EXTRA)}.
      </p>

      <ExtrasSelector state={state} dispatch={dispatch} />

      {deliveryType === "delivery" && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-300">Delivery</span>
          <span className="font-semibold">{fmt(deliveryFee)}</span>
        </div>
      )}
    </div>
  );
}
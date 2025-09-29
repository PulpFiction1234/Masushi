import {
  fmt,
  priceOf,
  keyOf,
  nameWithTipo,
  CartItemLike,
  CheckoutState,
  CheckoutAction,
} from "@/utils/checkout";
import ExtrasSelector from "./ExtrasSelector";
import React from "react";
import Image from "next/image";

const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

interface Props {
  cart: CartItemLike[];
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  subtotalProductos: number;
  deliveryType: "retiro" | "delivery";
  deliveryFee: number;
  maxGratisBasicas: number;   // pool soya/teriyaki
  maxGratisJWas?: number;     // pool jengibre/wasabi
  maxPalitosGratis?: number;  // 👈 nuevo
  onValidationChange?: (isValid: boolean) => void; // callback de validación
}

export default function SummaryPanel({
  cart,
  state,
  dispatch,
  subtotalProductos,
  deliveryType,
  deliveryFee,
  maxGratisBasicas,
  maxGratisJWas = 2,
  maxPalitosGratis = 0,
  onValidationChange,
}: Props) {
  return (
    <div className={`${card} p-4 bg-neutral-900`}>
      <h3 className="font-bold mb-3 text-neutral-50">Tu carrito</h3>
      <div className="space-y-2">
        {cart.map((item) => (
          <div key={keyOf(item)} className="text-sm text-neutral-200 flex items-center gap-3">
            {/* Imagen del producto */}
            <div className="flex-shrink-0">
              <Image
                src={item.imagen}
                alt={item.nombre}
                width={40}
                height={40}
                className="rounded-lg object-cover"
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl}
              />
            </div>
            
            {/* Información del producto */}
            <div className="flex-1 min-w-0">
              <div className="truncate">
                {nameWithTipo(item)}
              </div>
              <div className="text-neutral-400 text-xs">
                x{item.cantidad}
              </div>
            </div>
            
            {/* Precio */}
            <div className="flex-shrink-0">
              <span className="font-mono text-neutral-100 font-medium">
                {fmt(priceOf(item) * item.cantidad)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
        <p className="text-sm text-neutral-300">Subtotal productos</p>
        <p className="font-semibold">{fmt(subtotalProductos)}</p>
      </div>

      <ExtrasSelector
        state={state}
        dispatch={dispatch}
        maxGratisBasicas={maxGratisBasicas}
        maxGratisJWas={maxGratisJWas}
        maxPalitosGratis={maxPalitosGratis} // 👈 pasa el tope
        onValidationChange={onValidationChange} // 👈 callback de validación
      />

      {deliveryType === "delivery" && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-neutral-300">Delivery</span>
          <span className="font-semibold">{fmt(deliveryFee)}</span>
        </div>
      )}
    </div>
  );
}


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
import { useCart } from "@/context/CartContext";

const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

interface Props {
  cart: CartItemLike[];
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  subtotalProductos: number;
  deliveryType: "retiro" | "delivery";
  deliveryFee: number;
  maxGratisBasicas: number; // pool soya/teriyaki
  maxGratisJWas?: number; // pool jengibre/wasabi
  maxPalitosGratis?: number; // 👈 nuevo
  onValidationChange?: (isValid: boolean) => void; // callback de validación
  // Controlled inclusion map: which cart keys are included in the order
  includedMap?: Record<string, boolean>;
  onToggleInclude?: (cartKey: string, included: boolean) => void;
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
  includedMap,
  onToggleInclude,
}: Props) {
  // Prefer externally controlled inclusion map (from Checkout). If not provided,
  // fall back to an internal map so the component stays functional standalone.
  const [internalIncluded, setInternalIncluded] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const it of cart) map[keyOf(it)] = true;
    return map;
  });

  const isIncluded = (cartKey: string) => {
    if (includedMap && typeof includedMap[cartKey] !== "undefined") return !!includedMap[cartKey];
    return !!internalIncluded[cartKey];
  };

  // The UI in the mock doesn't show the red circular control next to each product.
  // Replace the interactive toggle with a neutral spacer to preserve layout.
  const { updateQuantity, removeFromCart } = useCart();

  const Spacer: React.FC = () => (
    // kept for accessibility fallback but not used; small neutral placeholder
    <div className="w-5 h-5 rounded-full bg-neutral-700/40 flex items-center justify-center" aria-hidden="true" />
  );
  return (
  <div className={`${card} p-4 bg-neutral-900 h-full flex flex-col`}>
      <h3 className="font-bold mb-2 text-neutral-50 text-sm">Tu carrito</h3>
      {/* Fixed-height content area: products (scrollable) | extras (static) */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_360px] gap-3 flex-1 h-full">
        <div className="h-[260px] md:h-[420px] overflow-auto pr-2">
          <div className="space-y-1">
            {cart.map((item) => (
              <div key={keyOf(item)} className="text-sm text-neutral-200 flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const k = keyOf(item);
                        if (item.cantidad > 1) updateQuantity(k, item.cantidad - 1);
                        else removeFromCart(k);
                      }}
                      aria-label={`Quitar 1 a ${nameWithTipo(item)}`}
                      className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 text-sm"
                    >
                      <span className="text-sm leading-none">−</span>
                    </button>

                    <div className="min-w-[16px] px-1 text-[10px] mx-1 text-white font-semibold bg-transparent rounded">{item.cantidad}</div>

                    <button
                      type="button"
                      onClick={() => updateQuantity(keyOf(item), item.cantidad + 1)}
                      aria-label={`Agregar 1 a ${nameWithTipo(item)}`}
                      className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-sm"
                    >
                      <span className="text-sm font-bold leading-none">+</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="truncate">{nameWithTipo(item)}</div>
                  <div className="text-neutral-400 text-xs">x{item.cantidad}</div>
                </div>

                <div className="flex-shrink-0">
                  <span className="font-mono text-neutral-100 font-medium">{fmt(priceOf(item) * item.cantidad)}</span>
                </div>
              </div>
            ))}
            </div>
        </div>

  <div className="w-full md:h-[420px] md:pr-3">
          <ExtrasSelector
            state={state}
            dispatch={dispatch}
            maxGratisBasicas={maxGratisBasicas}
            maxGratisJWas={maxGratisJWas}
            maxPalitosGratis={maxPalitosGratis}
            onValidationChange={onValidationChange}
          />
        </div>
      </div>
    </div>
  );
}


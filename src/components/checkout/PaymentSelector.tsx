import { PaymentMethod, CheckoutAction } from "@/utils/checkout";
import React from "react";

const inputBase =
  "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

interface Props {
  paymentMethod: PaymentMethod;
  dispatch: React.Dispatch<CheckoutAction>;
}

export default function PaymentSelector({ paymentMethod, dispatch }: Props) {
  return (
    <div>
      <label htmlFor="paymethod" className="block font-medium mb-1 text-neutral-200">
        Método de pago (en local)
      </label>
      <select
        id="paymethod"
        className={inputBase}
        value={paymentMethod}
        onChange={(e) =>
          dispatch({ type: "SET_FIELD", field: "paymentMethod", value: e.target.value as PaymentMethod })
        }
        required
      >
        <option value="">Selecciona una opción…</option>
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Crédito</option>
        <option value="transferencia">Transferencia</option>
      </select>
      <p className="text-xs text-neutral-400 mt-1">Solo informativo </p>
    </div>
  );
}
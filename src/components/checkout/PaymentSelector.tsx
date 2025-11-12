import { PaymentMethod, CheckoutAction } from "@/utils/checkout";
import React from "react";
import { fmt } from "@/utils/checkout";
import { AlertTriangle, Wallet } from "lucide-react";

const inputBase =
  "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

interface Props {
  paymentMethod: PaymentMethod;
  pagarCon: number | "";
  totalAPagar: number;
  dispatch: React.Dispatch<CheckoutAction>;
}

export default function PaymentSelector({ paymentMethod, pagarCon, totalAPagar, dispatch }: Props) {
  const handlePagarConChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      dispatch({ type: "SET_FIELD", field: "pagarCon", value: "" });
      return;
    }
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 0) {
      dispatch({ type: "SET_FIELD", field: "pagarCon", value: num });
    }
  };

  const vuelto = pagarCon && typeof pagarCon === "number" ? pagarCon - totalAPagar : 0;
  const mostrarVuelto = paymentMethod === "efectivo" && pagarCon && vuelto > 0;
  const pagoInsuficiente = paymentMethod === "efectivo" && pagarCon && typeof pagarCon === "number" && pagarCon < totalAPagar;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="paymethod" className="block font-medium mb-1 text-neutral-200">
          Método de pago (Informativo)
        </label>
        <select
          id="paymethod"
          className={inputBase}
          value={paymentMethod}
          onChange={(e) => {
            dispatch({ type: "SET_FIELD", field: "paymentMethod", value: e.target.value as PaymentMethod });
            // Limpiar el campo pagarCon si cambia el método de pago
            if (e.target.value !== "efectivo") {
              dispatch({ type: "SET_FIELD", field: "pagarCon", value: "" });
            }
          }}
          required
        >
          <option value="">Selecciona una opción…</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjetas</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <p className="text-xs text-neutral-400 mt-1">Solo informativo</p>
      </div>

      {/* Campo condicional para monto en efectivo */}
      {paymentMethod === "efectivo" && (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-4">
          <label htmlFor="pagarcon" className="block font-medium mb-2 text-neutral-200">
            ¿Con cuánto pagarás?
          </label>
          <input
            id="pagarcon"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 20000"
            value={pagarCon === "" ? "" : pagarCon.toLocaleString("es-CL")}
            onChange={handlePagarConChange}
            className={`${inputBase} ${pagoInsuficiente ? "border-red-500 focus:ring-red-500" : ""}`}
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-neutral-400">
              Total a pagar: <span className="font-semibold text-white">{fmt(totalAPagar)}</span>
            </p>
            {pagoInsuficiente && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>El monto ingresado es menor al total</span>
              </div>
            )}
            {mostrarVuelto && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                <span>
                  Vuelto: <span className="font-semibold">{fmt(vuelto)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje informativo para transferencia */}
      {paymentMethod === "transferencia" && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-200 font-medium mb-1">
            Pago por transferencia
          </p>
          <p className="text-xs text-blue-300/80">
            Te enviaremos un mensaje de WhatsApp con los datos bancarios para realizar la transferencia.
          </p>
        </div>
      )}
    </div>
  );
}


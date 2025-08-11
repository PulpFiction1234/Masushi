// src/components/CheckoutModal.tsx
"use client";

import { useState } from "react";
import type { CartItem, OrderData } from "../types";

type Props = {
  cart: CartItem[];
  open: boolean;
  onClose: () => void;
  onConfirm: (order: OrderData) => void;
};

export default function CheckoutModal({ cart, open, onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"retiro" | "delivery">("retiro");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  // Usamos valor y cantidad
  const total = cart.reduce((s, i) => s + i.valor * i.cantidad, 0);

  function validar(): boolean {
    if (!name.trim()) { setError("Ingresa el nombre"); return false; }
    if (!phone.trim()) { setError("Ingresa el teléfono"); return false; }
    if (tipoEntrega === "delivery" && !address.trim()) {
      setError("Ingresa la dirección para delivery");
      return false;
    }
    setError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    setSubmitting(true);

    // Incluimos id, codigo, nombre, valor y cantidad
    const itemsConDatos: CartItem[] = cart.map(item => ({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      valor: item.valor,
      cantidad: item.cantidad
    }));

    const order: OrderData = {
      name: name.trim(),
      phone: phone.trim(),
      tipoEntrega,
      address: tipoEntrega === "delivery" ? address.trim() : undefined,
      items: itemsConDatos,
      total
    };

    onConfirm(order);
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full max-w-md p-6 rounded shadow-lg z-10"
      >
        <h2 className="text-lg font-semibold mb-4">Confirmar pedido</h2>

        <label className="block text-sm mb-1">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />

        <label className="block text-sm mb-1">Teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="ej: 9 1234 5678"
          className="w-full border rounded p-2 mb-3"
        />

        <div className="mb-3">
          <label className="block text-sm mb-1">Tipo de entrega</label>
          <div className="flex gap-2">
            <label
              className={`px-3 py-2 border rounded cursor-pointer ${
                tipoEntrega === "retiro" ? "bg-gray-100" : ""
              }`}
            >
              <input
                className="mr-2"
                type="radio"
                name="tipo"
                checked={tipoEntrega === "retiro"}
                onChange={() => setTipoEntrega("retiro")}
              />
              Retiro
            </label>
            <label
              className={`px-3 py-2 border rounded cursor-pointer ${
                tipoEntrega === "delivery" ? "bg-gray-100" : ""
              }`}
            >
              <input
                className="mr-2"
                type="radio"
                name="tipo"
                checked={tipoEntrega === "delivery"}
                onChange={() => setTipoEntrega("delivery")}
              />
              Delivery
            </label>
          </div>
        </div>

        {tipoEntrega === "delivery" && (
          <>
            <label className="block text-sm mb-1">Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle y número, comuna"
              className="w-full border rounded p-2 mb-3"
            />
            <p className="text-xs text-gray-500 mb-3">
              Más adelante podrás usar el buscador para autocompletar y validar en el mapa.
            </p>
          </>
        )}

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Total</span>
            <span className="font-bold">${total}</span>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
            >
              {submitting ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

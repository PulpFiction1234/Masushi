"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation"; // App Router
import { formatCLP } from "@/utils/format";
import { getProductByCode } from "@/utils/productLookup";
import RecomendacionesModal from "./RecomendacionesModal";
import { normalizeImageUrl } from "@/utils/imageHelpers";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CarritoPanel: React.FC<Props> = ({ open, onClose }) => {
  const { cart, total, removeFromCart, updateQuantity, clearCart, ready } = useCart();
  const router = useRouter();
  const [showRecomendaciones, setShowRecomendaciones] = useState(false);
  const [modalYaMostrado, setModalYaMostrado] = useState(false);

  // Mientras no esté listo el provider, evita parpadeo
  const safeCart = useMemo(() => (ready ? cart : []), [ready, cart]);
  const hasItems = safeCart.length > 0;

  const safeTotal = useMemo(() => (ready ? total : 0), [ready, total]);

  // Detectar si hay salsas en el carrito
  const tieneSalsas = useMemo(() => {
    // Buscar productos con IDs de salsas (80, 81, 82 según tu código)
    return safeCart.some(item => [80, 81, 82].includes(item.id));
  }, [safeCart]);

  // Mostrar modal de recomendaciones cuando se abre el carrito si hay productos pero no salsas
  useEffect(() => {
    if (open && ready && hasItems && !tieneSalsas && !showRecomendaciones && !modalYaMostrado) {
      // Delay pequeño para que se vea la apertura del carrito primero
      const timer = setTimeout(() => {
        setShowRecomendaciones(true);
        setModalYaMostrado(true); // Marcar que ya se mostró
      }, 300);
      return () => clearTimeout(timer);
    }
    // No cerrar automáticamente el modal cuando se agreguen salsas
  }, [open, ready, hasItems, tieneSalsas, showRecomendaciones, modalYaMostrado]);

  const handlePedido = () => {
    setShowRecomendaciones(false);
    onClose();
    router.push("/checkout");
  };

  const handleClose = () => {
    setShowRecomendaciones(false);
    onClose();
  };

  // Resetear el estado cuando se cierre el carrito
  useEffect(() => {
    if (!open) {
      setShowRecomendaciones(false);
      // Resetear el flag cuando el carrito se cierre completamente
      const timer = setTimeout(() => {
        setModalYaMostrado(false);
      }, 500); // Delay para evitar que se muestre inmediatamente al reabrir
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-transparent z-40" onClick={handleClose} />}

      <div
        className={`fixed top-0 right-0 w-80 h-full bg-gray-900 shadow-lg transform transition-transform duration-300 z-50 text-white flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold">Carrito</h2>
          <button onClick={handleClose} className="text-gray-300 hover:text-gray-100" aria-label="Cerrar">
            ✖
          </button>
        </div>

        {/* LISTA CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4">
          {!ready ? (
            // Skeleton mientras hidrata
            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-gray-800 rounded" />
              <div className="h-12 bg-gray-800 rounded" />
              <div className="h-12 bg-gray-800 rounded" />
            </div>
          ) : hasItems ? (
            safeCart.map((item, idx) => {
              // Siempre obtener imagen del catálogo estático correctamente
              const prod = getProductByCode(item.codigo || "");
              let productImage: string = '';
              if (prod?.imagen) {
                if (typeof prod.imagen === 'object' && prod.imagen && 'src' in prod.imagen) {
                  productImage = prod.imagen.src;
                } else if (typeof prod.imagen === 'string') {
                  productImage = prod.imagen;
                }
              }
              // Solo normalizar si es string y no es StaticImageData
              const safeImage = productImage ? normalizeImageUrl(productImage) : '';
              const placeholderDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23fff' dy='.35em' text-anchor='middle'%3ESin img%3C/text%3E%3C/svg%3E";
              return (
                <div key={(item.codigo || "") + idx} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-b-0">
                  <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-700">
                    {safeImage ? (
                      <Image
                        src={safeImage}
                        alt={item.nombre}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center justify-center w-full h-full">Sin img</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-200">
                      {item.nombre}
                    </p>
                    {item.opcion && (
                      <p className="text-xs text-gray-400">
                        {item.opcion.label}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQuantity(item.cartKey, item.cantidad - 1)} className="px-2 py-1 bg-gray-800 rounded text-gray-300 hover:bg-gray-700">-</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.cartKey, item.cantidad + 1)} className="px-2 py-1 bg-gray-800 rounded text-gray-300 hover:bg-gray-700">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-gray-200">{formatCLP(item.precioUnit * item.cantidad)}</p>
                    <button onClick={() => removeFromCart(item.cartKey)} className="text-xs text-red-400 hover:underline">Eliminar</button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-100">Tu carrito está vacío</p>
          )}
        </div>

        {/* FOOTER */}
        {ready && hasItems && (
          <div className="p-4 border-t border-gray-700 space-y-2 bg-gray-900 flex-shrink-0">
            <p className="font-bold">
              Total: <span suppressHydrationWarning>{formatCLP(safeTotal)}</span>
            </p>
            <button
              onClick={handlePedido}
              className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600"
            >
              Realizar pedido
            </button>
            <button
              onClick={clearCart}
              className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600"
            >
              Vaciar carrito
            </button>
            <p className="italic" style={{ fontSize: "15px" }}>
              Las fotografías tienen fines ilustrativos; no constituyen una representación exacta del
              producto final.
            </p>
          </div>
        )}
      </div>
      
      {/* Modal de recomendaciones */}
      <RecomendacionesModal 
        open={showRecomendaciones} 
        onClose={() => setShowRecomendaciones(false)} 
      />
    </>
  );
};

export default CarritoPanel;


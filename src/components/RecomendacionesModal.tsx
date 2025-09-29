"use client";

import React from "react";
import Image from "next/image";
import { productos, type Producto } from "@/data/productos";
import { formatCLP } from "@/utils/format";
import { useCart } from "@/context/CartContext";
import { animateToCart } from "@/utils/animateToCart";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RecomendacionesModal: React.FC<Props> = ({ open, onClose }) => {
  const { addToCart } = useCart();

  // Filtrar solo las salsas extras
  const salsasExtras = productos.filter(p => p.categoria === "Salsas extras");

  const handleAddSalsa = (producto: Producto, e: React.MouseEvent<HTMLButtonElement>) => {
    // Agregar al carrito con animación
    addToCart(producto, {
      precioUnit: producto.valor
    });

    // Animación hacia el carrito
    animateToCart(e.nativeEvent);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay semi-transparente que no oculta completamente el carrito */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-[45]" onClick={onClose} />
      
      {/* Modal posicionado para no cubrir completamente el carrito */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[46] p-4">
        <div className="bg-gray-900 rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden border-2 border-gray-600">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">También suelen llevar</h2>
              <p className="text-gray-300 text-sm mt-1">Complementa tu pedido con nuestras salsas especiales</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="grid grid-cols-1 gap-3">
              {salsasExtras.map((salsa) => (
                <div key={salsa.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
                  <div className="flex items-center p-3">
                    <div className="w-16 h-16 relative flex-shrink-0 mr-4">
                      <Image
                        src={salsa.imagen}
                        alt={salsa.nombre}
                        fill
                        className="object-cover rounded-lg"
                        sizes="64px"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base mb-1 truncate">{salsa.nombre}</h3>
                      <p className="text-gray-300 text-xs mb-2 line-clamp-1">{salsa.descripcion}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-bold text-sm">
                          {formatCLP(salsa.valor)}
                        </span>
                        <button
                          onClick={(e) => handleAddSalsa(salsa, e)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors active:scale-95"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center p-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              No, gracias
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecomendacionesModal;
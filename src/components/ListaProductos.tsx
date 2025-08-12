"use client";
import React from "react";
import { productos } from "../data/productos";
import { useCart } from "@/context/CartContext";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
}

const ListaProductos: React.FC<ListaProductosProps> = ({ categoriaSeleccionada }) => {
  const { addToCart } = useCart();

  // Filtrar productos
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : productos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {productosFiltrados.map((prod) => (
        <div
          key={prod.id}
          className="bg-gray-900 rounded-lg shadow p-4 flex flex-col"
        >
          <img
            src={prod.imagen}
            alt={prod.nombre}
            className="w-150 h-100 object-cover rounded"
          />
          <h3 className="text-lg text-gray-400 font-semibold mt-2">{prod.nombre}</h3>
          <p className="text-sm text-gray-400">{prod.descripcion}</p>
          <p className="font-bold text-gray-400 mt-2">${prod.valor}</p>
          <button
            onClick={() => addToCart(prod)}
            className="bg-green-500 text-white px-4 py-2 mt-3 rounded hover:bg-green-600 w-full"
          >
            Agregar al carrito
          </button>
        </div>
      ))}
    </div>
  );
};

export default ListaProductos;

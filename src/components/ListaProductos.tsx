"use client";
import React, { useMemo, useEffect } from "react";
import { productos } from "../data/productos";
import { useCart } from "@/context/CartContext";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
}

// Normaliza strings: sin tildes, trim y lowercase
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita diacríticos
    .trim()
    .toLowerCase();

const ListaProductos: React.FC<ListaProductosProps> = ({ categoriaSeleccionada }) => {
  const { addToCart } = useCart();

  const selected = categoriaSeleccionada ? normalize(categoriaSeleccionada) : "";

  // 1) Filtra sin mutar (usando coincidencia normalizada)
  const productosFiltrados = useMemo(() => {
    if (!selected) return productos;
    return productos.filter((p) => normalize(p.categoria) === selected);
  }, [selected]);

  // 2) Crea una copia y ordénala de forma determinista
  const productosOrdenados = useMemo(() => {
    return [...productosFiltrados].sort((a, b) => a.id - b.id);
    // o por nombre: [...productosFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
  }, [productosFiltrados]);

  // (Opcional) Debug para verificar conteo al cambiar de categoría
  useEffect(() => {
    // console.log("Categoria:", categoriaSeleccionada, "=>", productosOrdenados.length, "items");
  }, [categoriaSeleccionada, productosOrdenados.length]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {productosOrdenados.map((prod) => (
        <div
          key={`${prod.id}-${prod.codigo}`} // clave 100% única y estable
          className="bg-gray-900 rounded-lg shadow p-4 flex flex-col"
        >
          <img
            src={prod.imagen}
            alt={prod.nombre}
            className="w-full h-70 object-cover rounded"
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

      {productosOrdenados.length === 0 && (
        <div className="col-span-full text-gray-400">
          No hay productos en esta categoría.
        </div>
      )}
    </div>
  );
};

export default ListaProductos;

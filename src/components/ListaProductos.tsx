// components/ListaProductos.tsx
"use client";
import React, { useMemo, useEffect, useState } from "react";
import { productos, type Producto, type ProductoOpcion } from "../data/productos";
import { useCart } from "@/context/CartContext";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
}

// Normaliza strings: sin tildes, trim y lowercase
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const ListaProductos: React.FC<ListaProductosProps> = ({ categoriaSeleccionada }) => {
  const { addToCart } = useCart();
  const selected = categoriaSeleccionada ? normalize(categoriaSeleccionada) : "";

  // Opción elegida POR producto (id -> opcionId)
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});

  // 1) Filtra sin mutar (usando coincidencia normalizada)
  const productosFiltrados = useMemo(() => {
    if (!selected) return productos;
    return productos.filter((p) => normalize(p.categoria) === selected);
  }, [selected]);

  // 2) Crea una copia y ordénala de forma determinista
  const productosOrdenados = useMemo(() => {
    return [...productosFiltrados].sort((a, b) => a.id - b.id);
  }, [productosFiltrados]);

  useEffect(() => {
    // console.log("Categoria:", categoriaSeleccionada, "=>", productosOrdenados.length, "items");
  }, [categoriaSeleccionada, productosOrdenados.length]);

  const onAdd = (prod: Producto) => {
    let opt: ProductoOpcion | undefined;

    // Si el producto tiene opciones, obligar selección
    if (prod.opciones?.length) {
      const selId = seleccion[prod.id];
      opt = prod.opciones.find((o) => o.id === selId);
      if (!opt) {
        alert("Por favor, elige una opción antes de agregar al carrito.");
        return;
      }
    }

    // precio final: opción.precio > producto.valor
    const precioUnit = opt?.precio ?? prod.valor;

    // Pasamos la opción elegida para que el carrito la guarde y la muestre
    addToCart(prod, { opcion: opt ? { id: opt.id, label: opt.label } : undefined, precioUnit });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {productosOrdenados.map((prod) => {
        const tieneOpciones = !!prod.opciones?.length;
        const seleccionActual = seleccion[prod.id] ?? "";

        return (
          <div
            key={`${prod.id}-${prod.codigo}`} // clave única y estable
            className="bg-gray-900 rounded-lg shadow p-4 flex flex-col"
          >
            <img
              src={prod.imagen}
              alt={prod.nombre}
              className="w-full h-70 object-cover rounded"
            />
            <h3 className="text-lg text-gray-400 font-semibold mt-2">{prod.nombre}</h3>
            <p className="text-sm text-gray-400">{prod.descripcion}</p>

            {/* Selector de opciones SOLO si el producto las tiene */}
            {tieneOpciones && (
              <fieldset className="mt-3 text-left">
                <legend className="text-sm text-gray-300 mb-1">Elige tipo</legend>
                <div className="space-y-1">
                  {prod.opciones!.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`opcion-${prod.id}`}
                        value={o.id}
                        checked={seleccionActual === o.id}
                        onChange={(e) =>
                          setSeleccion((prev) => ({ ...prev, [prod.id]: e.target.value }))
                        }
                        className="accent-green-500"
                        aria-label={o.label}
                      />
                      <span className="text-sm text-gray-200">
                        {o.label}
                        {typeof o.precio === "number" && o.precio !== prod.valor
                          ? ` — $${o.precio}`
                          : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <p className="font-bold text-gray-400 mt-3">
              $
              {tieneOpciones
                ? (() => {
                    const optSel = prod.opciones!.find((o) => o.id === seleccionActual);
                    return (optSel?.precio ?? prod.valor) || 0;
                  })()
                : prod.valor}
            </p>

            <button
              onClick={() => onAdd(prod)}
              className="bg-green-500 text-white px-4 py-2 mt-3 rounded hover:bg-green-600 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              // si tiene opciones y no hay selección, desactiva el botón
              disabled={tieneOpciones && !seleccionActual}
              aria-disabled={tieneOpciones && !seleccionActual}
            >
              Agregar al carrito
            </button>
          </div>
        );
      })}

      {productosOrdenados.length === 0 && (
        <div className="col-span-full text-gray-400">
          No hay productos en esta categoría.
        </div>
      )}
    </div>
  );
};

export default ListaProductos;

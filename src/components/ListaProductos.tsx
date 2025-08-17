"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { productos, type Producto, type ProductoOpcion } from "../data/productos";
import { animateToCart } from "@/utils/animateToCart";
import { useCart } from "@/context/CartContext";
import ProductCard from "./ProductCard";
import { normalize } from "@/utils/strings";
import { type FitMode } from "@/utils/constants";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
}

const ListaProductos: React.FC<ListaProductosProps> = ({ categoriaSeleccionada }) => {
  const { addToCart } = useCart();
  const selected = categoriaSeleccionada ? normalize(categoriaSeleccionada) : "";

  // Opción elegida POR producto (id -> opcionId)
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});

  // Modo de ajuste por producto (id -> "cover"/"contain")
  const [fitMap, setFitMap] = useState<Record<number, FitMode>>({});

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

  const onAdd = useCallback(
    (prod: Producto, selId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      let opt: ProductoOpcion | undefined;
      if (prod.opciones?.length) {
        opt = prod.opciones.find((o) => o.id === selId);
        if (!opt) {
          alert("Por favor, elige una opción antes de agregar al carrito.");
          return;
        }
      }

  const precioUnit = opt?.precio ?? prod.valor;
      addToCart(
        prod,
        { opcion: opt ? { id: opt.id, label: opt.label } : undefined, precioUnit }
      );
      animateToCart(e.nativeEvent as unknown as MouseEvent);
    },
    [addToCart]
  );

  return (
    <div
      className="
        grid
        [grid-template-columns:repeat(auto-fit,minmax(300px,380px))]
        gap-4 items-stretch justify-start
      "
    >
      {productosOrdenados.map((prod) => {
        const seleccionActual = seleccion[prod.id] ?? "";
         return (
          <ProductCard
            key={`${prod.id}-${prod.codigo ?? "sin-codigo"}`}
            product={prod}
            selectedOptionId={seleccionActual}
            onSelectOption={(id) =>
              setSeleccion((prev) => ({ ...prev, [prod.id]: id }))
            }
            fitMode={fitMap[prod.id]}
            onFitChange={(mode) =>
              setFitMap((m) => (m[prod.id] === mode ? m : { ...m, [prod.id]: mode }))
            }
            onAdd={(e) => onAdd(prod, seleccionActual, e)}
          />
        );
      })}

      {productosOrdenados.length === 0 && (
        <div className="col-span-full text-gray-400">No hay productos en esta categoría.</div>
      )}
    </div>
  );
};

export default ListaProductos;    
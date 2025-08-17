"use client";

import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
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

   // virtualización simple similar a react-window
  const COLUMN_WIDTH = 380;
  const ROW_HEIGHT = 600;
  const GAP = 16;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(containerRef.current?.clientWidth ?? 0);
      if (typeof window !== "undefined") {
        setContainerHeight(window.innerHeight - 200);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columnCount = Math.max(
    1,
    Math.floor((containerWidth + GAP) / (COLUMN_WIDTH + GAP))
  );
  const rowCount = Math.ceil(productosOrdenados.length / columnCount);
  const totalHeight = rowCount * (ROW_HEIGHT + GAP);

  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startRow = Math.floor(scrollTop / (ROW_HEIGHT + GAP));
  const endRow = Math.min(
    rowCount,
    Math.ceil((scrollTop + containerHeight) / (ROW_HEIGHT + GAP))
  );

  const items: React.ReactNode[] = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columnCount; col++) {
      const index = row * columnCount + col;
      if (index >= productosOrdenados.length) break;
      const prod = productosOrdenados[index];
      const seleccionActual = seleccion[prod.id] ?? "";
      items.push(
        <div
          key={`${prod.id}-${prod.codigo ?? "sin-codigo"}`}
          style={{
            position: "absolute",
            top: row * (ROW_HEIGHT + GAP),
            left: col * (COLUMN_WIDTH + GAP),
            width: COLUMN_WIDTH,
            height: ROW_HEIGHT,
          }}
          className="p-2 box-border"
        >
          <ProductCard
            product={prod}
            selectedOptionId={seleccionActual}
            onSelectOption={(id) =>
              setSeleccion((prev) => ({ ...prev, [prod.id]: id }))
            }
            fitMode={fitMap[prod.id]}
            onFitChange={(mode) =>
              setFitMap((m) =>
                m[prod.id] === mode ? m : { ...m, [prod.id]: mode }
              )
            }
            onAdd={(e) => onAdd(prod, seleccionActual, e)}
          />
        </div>
      );
    }
  }

  if (productosOrdenados.length === 0) {
    return (
      <div className="text-gray-400">No hay productos en esta categoría.</div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{ height: containerHeight, overflowY: "auto", position: "relative" }}
      className="w-full"
    >
      <div style={{ height: totalHeight, position: "relative" }}>{items}</div>
    </div>
  );
};

export default ListaProductos;    
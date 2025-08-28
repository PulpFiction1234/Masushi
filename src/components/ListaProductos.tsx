"use client";

import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { productos, type Producto, type ProductoOpcion } from "../data/productos";
import { animateToCart } from "@/utils/animateToCart";
import { useCart } from "@/context/CartContext";
import ProductCard from "./ProductCard";
import { normalize } from "@/utils/strings";
import { type FitMode } from "@/utils/constants";
import type { ArmaloPayload } from "./BuildYourRollSelector";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
  busqueda?: string; // ← NUEVO
}

const ListaProductos: React.FC<ListaProductosProps> = ({ categoriaSeleccionada, busqueda = "" }) => {
  const { addToCart } = useCart();
  const selected = categoriaSeleccionada ? normalize(categoriaSeleccionada) : "";

  const [seleccion, setSeleccion] = useState<Record<number, string>>({});
  const [fitMap, setFitMap] = useState<Record<number, FitMode>>({});

  // 🔎 NUEVO: utilidades búsqueda
  const query = normalize(busqueda).trim();
  const tokens = useMemo(
    () => query.split(/\s+/).filter(Boolean),
    [query]
  );

  // 1) Filtra por categoría + búsqueda (nombre/desc/código)
  const productosFiltrados = useMemo(() => {
    // base por categoría
    const base = selected
      ? productos.filter((p) => normalize(p.categoria) === selected)
      : productos;

    if (tokens.length === 0) return base;

    return base.filter((p) => {
      const nombre = normalize(p.nombre);
      const desc = normalize(p.descripcion ?? "");
      const cod = normalize(p.codigo ?? "");
      const codSinCeros = cod.replace(/^0+/, "");

      // AND: todos los tokens deben aparecer en algún campo
      return tokens.every((t) => {
        const tSinCeros = t.replace(/^0+/, "");
        return (
          nombre.includes(t) ||
          desc.includes(t) ||
          cod.includes(t) ||
          codSinCeros.includes(t) ||
          cod.includes(tSinCeros)
        );
      });
    });
  }, [selected, tokens]);

  // 2) Ordena estable
  const productosOrdenados = useMemo(() => {
    return [...productosFiltrados].sort((a, b) => a.id - b.id);
  }, [productosFiltrados]);

  const onAdd = useCallback(
    (prod: Producto, selId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      // caso configurable ("armalo")
      if (prod.configuracion?.tipo === "armalo") {
        if (!selId || !selId.startsWith("armalo:")) {
          alert("Completa tu selección antes de agregar al carrito.");
          return;
        }

        let payload: ArmaloPayload | null = null;
        try {
          payload = JSON.parse(selId.slice(7)) as ArmaloPayload;
        } catch {
          alert("Hubo un problema con la selección. Intenta nuevamente.");
          return;
        }

        if (!payload?.valid) {
          alert("Elige 2 proteínas, 2 acompañamientos y una envoltura.");
          return;
        }

        const precioUnit = typeof payload.price === "number" ? payload.price : prod.valor;

        addToCart(
          prod,
          {
            opcion: { id: "armalo", label: payload.label },
            precioUnit,
          }
        );
        animateToCart(e.nativeEvent as unknown as MouseEvent);
        return;
      }

      // caso normal
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

  // -------- Virtualización (sin cambios) --------
  const COLUMN_WIDTH = 380;
  const ROW_HEIGHT = 600;
  const GAP = 16;

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setViewport({ width: cr.width, height: cr.height });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columnCount = Math.max(1, Math.floor((viewport.width + GAP) / (COLUMN_WIDTH + GAP)));
  const rowCount = Math.ceil(productosOrdenados.length / columnCount);
  const totalHeight = rowCount * (ROW_HEIGHT + GAP);

  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startRow = Math.floor(scrollTop / (ROW_HEIGHT + GAP));
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + viewport.height) / (ROW_HEIGHT + GAP)));

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
            onSelectOption={(id) => setSeleccion((prev) => ({ ...prev, [prod.id]: id }))}
            fitMode={fitMap[prod.id]}
            onFitChange={(mode) =>
              setFitMap((m) => (m[prod.id] === mode ? m : { ...m, [prod.id]: mode }))
            }
            onAdd={(e) => onAdd(prod, seleccionActual, e)}
          />
        </div>
      );
    }
  }

  if (productosOrdenados.length === 0) {
    return (
      <div className="text-gray-400">
        {tokens.length > 0 ? "No encontramos productos que coincidan con tu búsqueda." : "No hay productos en esta categoría."}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="w-full h-full overflow-y-auto relative"
    >
      <div style={{ height: totalHeight, position: "relative" }}>{items}</div>
    </div>
  );
};

export default ListaProductos;

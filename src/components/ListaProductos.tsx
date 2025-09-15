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
  // caso configurable ("armalo")
if (prod.configuracion?.tipo === "armalo") {
  if (!selId || !selId.startsWith("armalo:")) {
    alert("Completa tu selección antes de agregar al carrito.");
    return;
  }

  // Parse seguro del payload que viene codificado en selId
  let payloadRaw: unknown = null;
  try {
    payloadRaw = JSON.parse(selId.slice(7));
  } catch {
    alert("Hubo un problema con la selección. Intenta nuevamente.");
    return;
  }

  // Helpers para leer propiedades opcionales sin depender del tipo ArmaloPayload exacto
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  const getStr = (o: unknown, key: string): string | undefined => {
    if (!isObject(o)) return undefined;
    const v = o[key];
    return typeof v === "string" ? v : undefined;
  };

  const getNum = (o: unknown, key: string): number | undefined => {
    if (!isObject(o)) return undefined;
    const v = o[key];
    return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
  };

  // Precio unitario desde payload.price si existe; si no, usa el valor del producto
  const maybePrice = getNum(payloadRaw, "price");
  const precioUnit = typeof maybePrice === "number" ? maybePrice : prod.valor;

  // Normalizador sin usar propiedades unicode (compat amplio)
  const norm = (s: unknown) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita diacríticos

  // Intentamos armar una firma “estructurada” si el payload trae campos comunes.
  // No asumimos un shape fijo: buscamos en payload.selection y en la raíz.
  const root = isObject(payloadRaw) ? payloadRaw : {};
  const selection = isObject((root as Record<string, unknown>).selection) ? ((root as Record<string, unknown>).selection as Record<string, unknown>) : undefined;

  const pick = (obj: Record<string, unknown> | undefined, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (typeof v === "string" || typeof v === "number") return v;
    }
    return undefined;
  };

  const parts = [
    pick(selection, ["proteina1"]) ?? pick(root as Record<string, unknown>, ["proteina1", "p1"]),
    pick(selection, ["proteina2"]) ?? pick(root as Record<string, unknown>, ["proteina2", "p2"]),
    pick(selection, ["acomp1"])    ?? pick(root as Record<string, unknown>, ["acomp1", "a1"]),
    pick(selection, ["acomp2"])    ?? pick(root as Record<string, unknown>, ["acomp2", "a2"]),
    pick(selection, ["envoltura"]) ?? pick(root as Record<string, unknown>, ["envoltura", "wrap"]),
  ].map(norm);

  // Hash estable FNV-1a por si no hay estructura (mismas combinaciones → misma firma)
  const fnv1a = (str: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  };

  // Si encontramos algo estructurado, lo usamos; si no, caemos al hash del payload ordenado
  const hasStructured = parts.some((x) => x.length > 0);

  const sortObject = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(sortObject);
    if (isObject(x)) {
      return Object.keys(x)
        .sort()
        .reduce((acc: Record<string, unknown>, k) => {
          acc[k] = sortObject((x as Record<string, unknown>)[k]);
          return acc;
        }, {});
    }
    return x;
    };

  const signature = hasStructured
    ? parts.join("|")
    : `hash:${fnv1a(JSON.stringify(sortObject(payloadRaw)))}`;

  const armaloId = `armalo:${signature}`;
  const label = getStr(payloadRaw, "label") ?? "Ármalo a tu gusto";

  addToCart(prod, {
    opcion: { id: armaloId, label },
    precioUnit,
  });

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


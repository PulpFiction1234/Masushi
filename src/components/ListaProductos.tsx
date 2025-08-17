"use client";
import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { productos, type Producto, type ProductoOpcion } from "../data/productos";
import { animateToCart } from "@/utils/animateToCart";
import { useCart } from "@/context/CartContext";

interface ListaProductosProps {
  categoriaSeleccionada: string | null;
}

// Normaliza strings: sin tildes, trim y lowercase
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// Formateador con separador de miles para Chile (sin decimales)
const fmtMiles = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Cambia este umbral si quieres ser más/menos permisivo con "contain"
type FitMode = "cover" | "contain";
const WIDE_THRESHOLD = 1.5; // 1.6–1.9 suele ir bien para promos muy anchas

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

  // Devuelve true si se agregó correctamente (para disparar la animación)
  const onAdd = (prod: Producto): boolean => {
    let opt: ProductoOpcion | undefined;

    // Si el producto tiene opciones, obligar selección
    if (prod.opciones?.length) {
      const selId = seleccion[prod.id];
      opt = prod.opciones.find((o) => o.id === selId);
      if (!opt) {
        alert("Por favor, elige una opción antes de agregar al carrito.");
        return false;
      }
    }

    // precio final: opción.precio > producto.valor
    const precioUnit = opt?.precio ?? prod.valor;

    // Pasamos la opción elegida para que el carrito la guarde y la muestre
    addToCart(
      prod,
      { opcion: opt ? { id: opt.id, label: opt.label } : undefined, precioUnit }
    );
    return true;
  };

  return (
    <div
      className="
        grid
        [grid-template-columns:repeat(auto-fit,minmax(300px,380px))]
        gap-4 items-stretch justify-start
      "
    >
      {productosOrdenados.map((prod) => {
        const tieneOpciones = !!prod.opciones?.length;
        const seleccionActual = seleccion[prod.id] ?? "";
        const objectFitClass = fitMap[prod.id] === "contain" ? "object-contain" : "object-cover";

        return (
          <div
            key={`${prod.id}-${prod.codigo ?? "sin-codigo"}`} // clave única y estable
            className="bg-gray-900 rounded-lg shadow p-4 flex flex-col h-full"
          >
            {/* Imagen: cuadrado como en la 1ª imagen; cambia a contain si es muy ancha */}
            <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
              <Image
                src={prod.imagen}
                alt={prod.nombre}
                fill
                sizes="(min-width:2000px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                className={objectFitClass}
                priority={false}
                onLoadingComplete={(img) => {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  if (ratio >= WIDE_THRESHOLD) {
                    // solo actualiza si cambia a 'contain' para evitar renders innecesarios
                    setFitMap((m) => (m[prod.id] === "contain" ? m : { ...m, [prod.id]: "contain" }));
                  } else {
                    // asegura cover en el resto
                    setFitMap((m) => (m[prod.id] === "cover" || m[prod.id] === undefined ? m : { ...m, [prod.id]: "cover" }));
                  }
                }}
              />
            </div>

            <h3 className="text-lg text-gray-200 font-semibold mt-2">{prod.nombre}</h3>
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
                          ? ` — $${fmtMiles.format(o.precio)}`
                          : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Bloque pegado al fondo: precio + botón */}
            <div className="mt-auto">
              <p className="font-bold text-gray-200 mt-3">
                {"$"}
                {fmtMiles.format(
                  tieneOpciones
                    ? (() => {
                        const optSel = prod.opciones!.find((o) => o.id === seleccionActual);
                        return (optSel?.precio ?? prod.valor) || 0;
                      })()
                    : prod.valor
                )}
              </p>

              <button
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  const ok = onAdd(prod);
                  if (ok) animateToCart(e.nativeEvent as unknown as MouseEvent);
                }}
                className="bg-green-500 text-white px-4 py-2 mt-3 rounded hover:bg-green-600 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                // si tiene opciones y no hay selección, desactiva el botón
                disabled={tieneOpciones && !seleccionActual}
                aria-disabled={tieneOpciones && !seleccionActual}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        );
      })}

      {productosOrdenados.length === 0 && (
        <div className="col-span-full text-gray-400">No hay productos en esta categoría.</div>
      )}
    </div>
  );
};

export default ListaProductos;

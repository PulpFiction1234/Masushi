import React, { useEffect } from "react";
import Image from "next/image";
import { type Producto } from "@/data/productos";
import ProductOptionSelector from "./ProductOptionSelector";
import BuildYourRollSelector from "./BuildYourRollSelector";
import { fmtMiles } from "@/utils/format";

function parseArmalo(encoded?: string) {
  if (!encoded || !encoded.startsWith("armalo:")) return null;
  try {
    return JSON.parse(encoded.slice(7));
  } catch {
    return null;
  }
}

interface Props {
  open: boolean;
  product: Producto | null;
  selectedOptionId: string;
  isAvailable: boolean;
  onSelectOption(id: string): void;
  onClose(): void;
  onConfirm(e: React.MouseEvent<HTMLButtonElement>): void;
}

export default function ProductQuickAddModal({
  open,
  product,
  selectedOptionId,
  isAvailable,
  onSelectOption,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const tieneOpciones = !!product.opciones?.length;
  const esArmalo = product.configuracion?.tipo === "armalo";
  const armalo = esArmalo ? parseArmalo(selectedOptionId) : null;

  const precioMostrar = esArmalo
    ? armalo?.price ?? product.valor
    : tieneOpciones
    ? (() => {
        const optSel = product.opciones!.find((o) => o.id === selectedOptionId);
        return (optSel?.precio ?? product.valor) || 0;
      })()
    : product.valor;

  const canConfirm = isAvailable && (esArmalo ? !!armalo?.valid : !tieneOpciones || !!selectedOptionId);

  return (
    <div className="fixed inset-0 z-[80] bg-[#111111] text-white flex flex-col">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 rounded-full bg-[#D1933E] px-3 py-1.5 text-base text-white"
        >
          ✕
        </button>

        <div className="relative h-[40dvh] min-h-[240px] w-full bg-black">
          {product.imagen && (
            <Image
              src={product.imagen}
              alt={product.nombre}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 560px, 100vw"
              quality={60}
              placeholder={typeof product.imagen === "string" ? (product.blurDataUrl ? "blur" : undefined) : "blur"}
              blurDataURL={typeof product.imagen === "string" ? product.blurDataUrl : undefined}
            />
          )}
          {product.codigo && (
            <div className="absolute top-3 left-3 bg-[#93C021] text-black text-sm md:text-base font-bold px-2.5 py-1 rounded-md">
              {product.codigo}
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:p-5 space-y-3 flex-1">
          <div>
            <h3 className="text-2xl font-semibold leading-tight">{product.nombre}</h3>
            {product.descripcion ? <p className="mt-2 text-sm text-gray-300 leading-relaxed">{product.descripcion}</p> : null}
          </div>

          {!esArmalo && tieneOpciones && (
            <ProductOptionSelector
              productId={product.id}
              opciones={product.opciones!}
              selectedId={selectedOptionId}
              onSelect={onSelectOption}
              precioBase={product.valor}
            />
          )}

          {esArmalo && product.configuracion && (
            <BuildYourRollSelector
              productId={product.id}
              config={product.configuracion}
              precioBase={product.valor}
              selectedId={selectedOptionId}
              onChange={onSelectOption}
            />
          )}
        </div>

        <div className="border-t border-white/10 bg-[#111111] p-4 sm:p-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="w-full rounded-xl bg-[#93C021] text-black font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAvailable ? `Agregar ${"$"}${fmtMiles.format(precioMostrar)}` : "Sin stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

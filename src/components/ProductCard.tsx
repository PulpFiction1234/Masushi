import React from "react";
import Image from "next/image";
import { type Producto } from "@/data/productos";
import ProductOptionSelector from "./ProductOptionSelector";
import BuildYourRollSelector from "./BuildYourRollSelector"; // ⬅️ NUEVO
import { fmtMiles } from "@/utils/format";
import { WIDE_THRESHOLD, type FitMode } from "@/utils/constants";

function parseArmalo(encoded?: string) {
  if (!encoded || !encoded.startsWith("armalo:")) return null;
  try { return JSON.parse(encoded.slice(7)); } catch { return null; }
}

interface Props {
  product: Producto;
  selectedOptionId: string;
  onSelectOption(id: string): void;
  onAdd(e: React.MouseEvent<HTMLButtonElement>): void;
  fitMode?: FitMode;
  onFitChange(mode: FitMode): void;
}

const ProductCard: React.FC<Props> = ({
  product,
  selectedOptionId,
  onSelectOption,
  onAdd,
  fitMode = "cover",
  onFitChange,
}) => {
  const tieneOpciones = !!product.opciones?.length;
  const esArmalo = product.configuracion?.tipo === "armalo";
  const armalo = esArmalo ? parseArmalo(selectedOptionId) : null;

  const objectFitClass = fitMode === "contain" ? "object-contain" : "object-cover";

  const precioMostrar = esArmalo
    ? (armalo?.price ?? product.valor)
    : tieneOpciones
      ? (() => {
          const optSel = product.opciones!.find((o) => o.id === selectedOptionId);
          return (optSel?.precio ?? product.valor) || 0;
        })()
      : product.valor;

  const disabled =
    esArmalo ? !armalo?.valid : (tieneOpciones && !selectedOptionId);

  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 flex flex-col h-full">
      <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
        <Image
          src={product.imagen}
          alt={product.nombre}
          fill
          sizes="(min-width:2000px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className={objectFitClass}
          priority={false}
          quality={60}
          placeholder={
            typeof product.imagen === "string"
              ? product.blurDataUrl
                ? "blur"
                : undefined
              : "blur"
          }
          blurDataURL={
            typeof product.imagen === "string" ? product.blurDataUrl : undefined
          }
          onLoadingComplete={(img) => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const newMode: FitMode = ratio >= WIDE_THRESHOLD ? "contain" : "cover";
            if (newMode !== fitMode) onFitChange(newMode);
          }}
        />
      </div>

      <h3 className="text-lg text-gray-200 font-semibold mt-2">{product.nombre}</h3>
      <p className="text-sm text-gray-400">{product.descripcion}</p>

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

      <div className="mt-auto">
        <p className="font-bold text-gray-200 mt-3">
          {"$"}
          {fmtMiles.format(precioMostrar)}
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="bg-green-500 text-white px-4 py-2 mt-3 rounded hover:bg-green-600 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
          aria-disabled={disabled}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);

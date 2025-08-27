import React from "react";
import { type ProductoOpcion } from "@/data/productos";
import { fmtMiles } from "@/utils/format";

interface Props {
  productId: number;
  opciones: ProductoOpcion[];
  selectedId: string;
  onSelect(id: string): void;
  precioBase: number;
}

const ProductOptionSelector: React.FC<Props> = ({
  productId,
  opciones,
  selectedId,
  onSelect,
  precioBase,
}) => (
  <fieldset className="mt-3 text-left">
    <legend className="text-xs text-gray-400 mb-1">Elige tipo</legend>
    <div className="space-y-1">
      {opciones.map((o) => (
        <label key={o.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`opcion-${productId}`}
            value={o.id}
            checked={selectedId === o.id}
            onChange={() => onSelect(o.id)}
            className="accent-green-500"
            aria-label={o.label}
          />
          <span className="text-xs text-gray-200">
            {o.label}
            {typeof o.precio === "number" && o.precio !== precioBase
              ? ` — $${fmtMiles.format(o.precio)}`
              : ""}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

export default React.memo(ProductOptionSelector);

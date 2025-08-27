// components/BuildYourRollSelector.tsx
import React, { useEffect, useMemo, useState } from "react";
import { type ConfigArmalo, type ProductoOpcion } from "@/data/productos";
// import { fmtMiles } from "@/utils/format"; // ⬅️ ya no mostramos precio

type Sel = {
  proteina1?: string;
  proteina2?: string;
  acomp1?: string;
  acomp2?: string;
  envoltura?: string;
};

function optMap(menus: ConfigArmalo["menus"]) {
  const map = new Map<string, ProductoOpcion>();
  menus.forEach((m) => m.opciones.forEach((o) => map.set(o.id, o)));
  return map;
}

function encodeArmalo(payload: any) {
  return "armalo:" + JSON.stringify(payload);
}

function decodeArmalo(selectedId: string | undefined) {
  if (!selectedId?.startsWith("armalo:")) return null;
  try { return JSON.parse(selectedId.slice(7)); } catch { return null; }
}

interface Props {
  productId: number;
  config: ConfigArmalo;
  precioBase: number;
  selectedId: string;
  onChange(encoded: string): void;
}

const BuildYourRollSelector: React.FC<Props> = ({
  productId,
  config,
  precioBase,
  selectedId,
  onChange,
}) => {
  const allOpts = useMemo(() => optMap(config.menus), [config.menus]);
  const initial = decodeArmalo(selectedId) as Sel | null;
  const [sel, setSel] = useState<Sel>(initial ?? {});

  const isValid =
    !!sel.proteina1 && !!sel.proteina2 && sel.proteina1 !== sel.proteina2 &&
    !!sel.acomp1 && !!sel.acomp2 && sel.acomp1 !== sel.acomp2 &&
    !!sel.envoltura;

  // Calculamos el total, pero no lo mostramos.
  const precioExtra =
    (sel.proteina1 ? allOpts.get(sel.proteina1)?.precio ?? 0 : 0) +
    (sel.proteina2 ? allOpts.get(sel.proteina2)?.precio ?? 0 : 0) +
    (sel.acomp1 ? allOpts.get(sel.acomp1)?.precio ?? 0 : 0) +
    (sel.acomp2 ? allOpts.get(sel.acomp2)?.precio ?? 0 : 0) +
    (sel.envoltura ? allOpts.get(sel.envoltura)?.precio ?? 0 : 0);

  const precioTotal = precioBase + precioExtra;

  const label = isValid
    ? `P: ${allOpts.get(sel.proteina1!)?.label} + ${allOpts.get(sel.proteina2!)?.label} · ` +
      `A: ${allOpts.get(sel.acomp1!)?.label} + ${allOpts.get(sel.acomp2!)?.label} · ` +
      `Env: ${allOpts.get(sel.envoltura!)?.label}`
    : "Personaliza tu roll";

  useEffect(() => {
    const payload = { ...sel, price: precioTotal, label, valid: isValid };
    onChange(encodeArmalo(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.proteina1, sel.proteina2, sel.acomp1, sel.acomp2, sel.envoltura]);

  const getMenu = (id: keyof Sel) => config.menus.find((m) => m.id === id)!;

  const renderSelect = (
    id: keyof Sel,
    labelText: string,
    opciones: ProductoOpcion[],
    otherSelected?: string
  ) => (
    <label className="block text-[10px] leading-4 text-gray-400 font-medium">
      {labelText}
      <select
        className="mt-0.5 w-full bg-gray-800 text-gray-100 text-[10px] leading-4 rounded-sm border border-gray-700 px-2 py-1 h-5"
        value={sel[id] ?? ""}
        onChange={(e) => setSel((s) => ({ ...s, [id]: e.target.value || undefined }))}
      >
        <option value="">-- Selecciona --</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id} disabled={otherSelected === o.id}>
            {o.label}
            {/* si una opción tiene recargo, se puede mantener en el texto */}
            {typeof o.precio === "number" && o.precio > 0 ? ` (+$${o.precio})` : ""}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <fieldset className="mt-3 text-left text-[10px]">
     

      {/* Proteínas lado a lado */}
      <div className="grid grid-cols-2 gap-1">
        {renderSelect("proteina1", getMenu("proteina1").label, getMenu("proteina1").opciones, sel.proteina2)}
        {renderSelect("proteina2", getMenu("proteina2").label, getMenu("proteina2").opciones, sel.proteina1)}
      </div>

      {/* Acompañamientos lado a lado */}
      <div className="grid grid-cols-2 gap-1 mt-1">
        {renderSelect("acomp1", getMenu("acomp1").label, getMenu("acomp1").opciones, sel.acomp2)}
        {renderSelect("acomp2", getMenu("acomp2").label, getMenu("acomp2").opciones, sel.acomp1)}
      </div>

      {/* Envoltura ancho completo */}
      <div className="mt-1">
        {renderSelect("envoltura", getMenu("envoltura").label, getMenu("envoltura").opciones)}
      </div>

      {/* ❌ Eliminado el párrafo de "Precio: ..." para ganar espacio visual */}
    </fieldset>
  );
};

export default React.memo(BuildYourRollSelector);

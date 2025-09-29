import {
  fmt,
  PRECIO_ACEVICHADA,
  PRECIO_MARACUYA,
  PRECIO_JENGIBRE_EXTRA,
  PRECIO_WASABI_EXTRA,
  PRECIO_SOYA_EXTRA,
  PRECIO_TERIYAKI_EXTRA,
  CheckoutState,
  CheckoutAction,
  // 👇 nuevos precios
  PRECIO_PALITO_EXTRA,
  PRECIO_AYUDA_PALITOS,
} from "@/utils/checkout";
import React from "react";

const smallInput =
  "border border-white/10 bg-neutral-800/80 rounded-xl w-20 px-2 py-1 text-center text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500";
const inputBase =
  "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

interface Props {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
  /** total gratis disponibles SOLO para soya/teriyaki */
  maxGratisBasicas: number;
  /** pool gratis jengibre/wasabi (default 2) */
  maxGratisJWas?: number;
  /** tope de palitos gratis calculado desde el carrito */
  maxPalitosGratis?: number;
  /** callback para validación de salsas */
  onValidationChange?: (isValid: boolean) => void;
}

export default function ExtrasSelector({
  state,
  dispatch,
  maxGratisBasicas,
  maxGratisJWas = 2,
  maxPalitosGratis = 0,
  onValidationChange,
}: Props) {
  // ===== Estados de "Sin salsas" =====
  const [sinSalsasBasicas, setSinSalsasBasicas] = React.useState(false);
  const [sinJengibreWasabi, setSinJengibreWasabi] = React.useState(false);

  // ===== Validación de salsas obligatorias =====
  React.useEffect(() => {
    const tieneSalsasBasicas = Number(state.soya || 0) > 0 || Number(state.teriyaki || 0) > 0;
    const tieneJengibreWasabi = Number(state.jengibre || 0) > 0 || Number(state.wasabi || 0) > 0;
    
    // Es válido si:
    // 1. Marcó "sin salsas básicas" O tiene al menos una salsa básica
    // 2. Marcó "sin jengibre/wasabi" O tiene al menos uno de estos
    const esSalsasBasicasValido = sinSalsasBasicas || tieneSalsasBasicas;
    const esJengibreWasabiValido = sinJengibreWasabi || tieneJengibreWasabi;
    
    const esValido = esSalsasBasicasValido && esJengibreWasabiValido;
    onValidationChange?.(esValido);
  }, [state.soya, state.teriyaki, state.jengibre, state.wasabi, sinSalsasBasicas, sinJengibreWasabi, onValidationChange]);

  // ===== Pool GRATIS: Soya/Teriyaki =====
  const soyaGratis = Number(state.soya || 0);
  const teriGratis = Number(state.teriyaki || 0);
  const usados = soyaGratis + teriGratis;
  const restantes = Math.max(0, maxGratisBasicas - usados);

  const clampInt = (val: number) => Math.max(0, Math.floor(val));

  const onChangeSoyaGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    const maxForSoya = Math.max(0, maxGratisBasicas - teriGratis);
    if (next > maxForSoya) next = maxForSoya;
    dispatch({ type: "SET_FIELD", field: "soya", value: raw === "" ? "" : next });
  };

  const onChangeTeriGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    const maxForTeri = Math.max(0, maxGratisBasicas - soyaGratis);
    if (next > maxForTeri) next = maxForTeri;
    dispatch({ type: "SET_FIELD", field: "teriyaki", value: raw === "" ? "" : next });
  };

  // ===== Pool GRATIS: Jengibre/Wasabi (máx 2 entre ambos) =====
  const jengibreFree = Number(state.jengibre || 0);
  const wasabiFree = Number(state.wasabi || 0);
  const usadosJW = jengibreFree + wasabiFree;
  const restantesJW = Math.max(0, maxGratisJWas - usadosJW);

  const onChangeJengibreGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    const maxForJ = Math.max(0, maxGratisJWas - wasabiFree);
    if (next > maxForJ) next = maxForJ;
    dispatch({ type: "SET_FIELD", field: "jengibre", value: raw === "" ? "" : next });
  };

  const onChangeWasabiGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    const maxForW = Math.max(0, maxGratisJWas - jengibreFree);
    if (next > maxForW) next = maxForW;
    dispatch({ type: "SET_FIELD", field: "wasabi", value: raw === "" ? "" : next });
  };

  // ===== Palitos (gratis) con tope por carrito =====
  const onChangePalitosGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    if (maxPalitosGratis > 0 && next > maxPalitosGratis) next = maxPalitosGratis;
    dispatch({ type: "SET_FIELD", field: "palitos", value: raw === "" ? "" : next });
  };

  // Estado de validación para mostrar
  const tieneSalsasBasicas = Number(state.soya || 0) > 0 || Number(state.teriyaki || 0) > 0;
  const tieneJengibreWasabi = Number(state.jengibre || 0) > 0 || Number(state.wasabi || 0) > 0;
  const esSalsasBasicasValido = sinSalsasBasicas || tieneSalsasBasicas;
  const esJengibreWasabiValido = sinJengibreWasabi || tieneJengibreWasabi;
  const esValido = esSalsasBasicasValido && esJengibreWasabiValido;

  return (
    <div>
      {/* === Salsas gratis (todo en un MISMO recuadro) === */}
      <div className={`rounded-xl border p-3 bg-neutral-900/60 ${!esValido ? 'border-orange-400/50 bg-orange-900/10' : 'border-white/10'}`}>
        <h4 className="font-semibold mb-3 text-neutral-50">
          Salsas gratis del pedido
          {!esValido && (
            <span className="ml-2 text-sm text-orange-400 font-normal">
              (Selecciona salsas o marca "Sin salsas")
            </span>
          )}
        </h4>

        {/* 2 columnas: izquierda Soya/Teri, derecha Jengibre/Wasabi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Izquierda: Soya/Teriyaki */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">
              Gratis Soya/Teriyaki:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisBasicas}</span>
            </p>
            
            {/* Checkbox Sin salsas básicas */}
            <div className="mb-3">
              <label className="flex items-center text-sm text-neutral-200">
                <input
                  type="checkbox"
                  checked={sinSalsasBasicas}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSinSalsasBasicas(checked);
                    if (checked) {
                      dispatch({ type: "SET_FIELD", field: "soya", value: 0 });
                      dispatch({ type: "SET_FIELD", field: "teriyaki", value: 0 });
                    }
                  }}
                  className="mr-2 rounded border-neutral-600 bg-neutral-700 text-emerald-500 focus:ring-emerald-500"
                />
                Sin salsas Soya/Teriyaki
              </label>
            </div>

            {!sinSalsasBasicas && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center">
                  <label htmlFor="soya" className="block text-sm font-medium text-neutral-200 mb-1">
                    Soya
                  </label>
                  <input
                    id="soya"
                    type="number"
                    min={0}
                    max={Math.max(0, maxGratisBasicas - teriGratis)}
                    value={state.soya}
                    onChange={(e) => onChangeSoyaGratis(e.target.value)}
                    className={smallInput}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <label htmlFor="teriyaki" className="block text-sm font-medium text-neutral-200 mb-1">
                    Teriyaki
                  </label>
                  <input
                    id="teriyaki"
                    type="number"
                    min={0}
                    max={Math.max(0, maxGratisBasicas - soyaGratis)}
                    value={state.teriyaki}
                    onChange={(e) => onChangeTeriGratis(e.target.value)}
                    className={smallInput}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Derecha: Jengibre/Wasabi */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">
              Gratis Jengibre/Wasabi:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisJWas}</span>

            </p>
            
            {/* Checkbox Sin jengibre/wasabi */}
            <div className="mb-3">
              <label className="flex items-center text-sm text-neutral-200">
                <input
                  type="checkbox"
                  checked={sinJengibreWasabi}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSinJengibreWasabi(checked);
                    if (checked) {
                      dispatch({ type: "SET_FIELD", field: "jengibre", value: 0 });
                      dispatch({ type: "SET_FIELD", field: "wasabi", value: 0 });
                    }
                  }}
                  className="mr-2 rounded border-neutral-600 bg-neutral-700 text-emerald-500 focus:ring-emerald-500"
                />
                Sin Jengibre/Wasabi
              </label>
            </div>

            {!sinJengibreWasabi && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center">
                  <label htmlFor="jengibreFree" className="block text-sm font-medium text-neutral-200 mb-1">
                    Jengibre
                  </label>
                  <input
                    id="jengibreFree"
                    type="number"
                    min={0}
                    max={Math.max(0, maxGratisJWas - wasabiFree)}
                    value={state.jengibre}
                    onChange={(e) => onChangeJengibreGratis(e.target.value)}
                    className={smallInput}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <label htmlFor="wasabiFree" className="block text-sm font-medium text-neutral-200 mb-1">
                    Wasabi
                  </label>
                  <input
                    id="wasabiFree"
                    type="number"
                    min={0}
                    max={Math.max(0, maxGratisJWas - jengibreFree)}
                    value={state.wasabi}
                    onChange={(e) => onChangeWasabiGratis(e.target.value)}
                    className={smallInput}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Palitos (gratis) debajo de ambas columnas, MISMO recuadro */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-end gap-3">
            <div className="flex flex-col items-center">
              <label htmlFor="palitos" className="block text-sm font-medium text-neutral-200 mb-1">
                Palitos
              </label>
              <input
                id="palitos"
                type="number"
                min={0}
                max={maxPalitosGratis > 0 ? maxPalitosGratis : undefined}
                value={state.palitos}
                onChange={(e) => onChangePalitosGratis(e.target.value)}
                className={smallInput}
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Máx. palitos gratis: <span className="text-neutral-200 font-semibold">{maxPalitosGratis}</span>
            </p>
            
          <div className="flex flex-col items-center">
            <label htmlFor="ayudaPalitos" className="block text-sm font-medium text-neutral-200 mb-1">
              Ayuda palitos ({fmt(PRECIO_AYUDA_PALITOS)} c/u)
            </label>
            <input
              id="ayudaPalitos"
              type="number"
              min={0}
              value={state.ayudaPalitos}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "ayudaPalitos",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>
          </div>
        </div>
      </div>



      {/* Observaciones */}
      <div className="mt-3">
        <label htmlFor="obs" className="block text-sm font-medium text-neutral-200 mb-1">
          Observaciones
        </label>
        <textarea
          id="obs"
          rows={2}
          className={`${inputBase} resize-none`}
          placeholder="Ej: sin cebollín, sin nori, etc."
          value={state.observacion}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "observacion", value: e.target.value })
          }
        />
        <div className="mt-2 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded p-2">
          Todo cambio puede llevar un valor extra dependiendo del requerimiento.
        </div>
      </div>
    </div>
  );
}


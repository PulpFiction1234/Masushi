import {
  fmt,
  CheckoutState,
  CheckoutAction,
  PRECIO_AYUDA_PALITOS,
} from "@/utils/checkout";
import React from "react";

const smallInput =
  "border border-white/10 bg-neutral-800/80 rounded-lg w-16 px-1.5 py-1 text-center text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500";
const inputBase =
  "w-full rounded-lg border border-white/10 bg-neutral-800/80 px-2 py-1 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm";

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
  // Small Toggle component to mimic pill switches used in the mock
  const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; ariaLabel?: string; disabled?: boolean }> = ({ checked, onChange, ariaLabel, disabled }) => {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${checked ? 'bg-emerald-500' : 'bg-red-500'}`}
      >
        <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    );
  };
  // ===== Estados de "Sin salsas" =====
  const [sinSalsasBasicas, setSinSalsasBasicas] = React.useState(false);

  // ===== Validación de salsas obligatorias =====
  React.useEffect(() => {
    const tieneSalsasBasicas = Number(state.soya || 0) > 0 || Number(state.teriyaki || 0) > 0;
    
    // Es válido si:
    // 1. Marcó "sin salsas básicas" O tiene al menos una salsa básica
    const esSalsasBasicasValido = sinSalsasBasicas || tieneSalsasBasicas;
    const esValido = esSalsasBasicasValido;
    onValidationChange?.(esValido);
  }, [state.soya, state.teriyaki, sinSalsasBasicas, onValidationChange]);

  // ===== Pool GRATIS: Soya/Teriyaki =====
  const soyaGratis = Number(state.soya || 0);
  const teriGratis = Number(state.teriyaki || 0);
  // const restantes = Math.max(0, maxGratisBasicas - (soyaGratis + teriGratis));

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
  const jengibreSelected = Number(state.jengibre || 0) > 0;
  const wasabiSelected = Number(state.wasabi || 0) > 0;

  const handleToggleJengibre = (checked: boolean) => {
    if (checked) {
      if (!jengibreSelected) {
        const otherSelected = wasabiSelected ? 1 : 0;
        if (otherSelected + 1 > maxGratisJWas) return;
      }
      dispatch({ type: "SET_FIELD", field: "jengibre", value: 1 });
    } else {
      dispatch({ type: "SET_FIELD", field: "jengibre", value: 0 });
    }
  };

  const handleToggleWasabi = (checked: boolean) => {
    if (checked) {
      if (!wasabiSelected) {
        const otherSelected = jengibreSelected ? 1 : 0;
        if (otherSelected + 1 > maxGratisJWas) return;
      }
      dispatch({ type: "SET_FIELD", field: "wasabi", value: 1 });
    } else {
      dispatch({ type: "SET_FIELD", field: "wasabi", value: 0 });
    }
  };

  // ===== Palitos (gratis) con tope por carrito =====
  const onChangePalitosGratis = (raw: string) => {
    let next = clampInt(Number(raw === "" ? 0 : raw));
    if (maxPalitosGratis > 0 && next > maxPalitosGratis) next = maxPalitosGratis;
    dispatch({ type: "SET_FIELD", field: "palitos", value: raw === "" ? "" : next });
  };

  // Estado de validación para mostrar
  const tieneSalsasBasicas = Number(state.soya || 0) > 0 || Number(state.teriyaki || 0) > 0;
  const esSalsasBasicasValido = sinSalsasBasicas || tieneSalsasBasicas;
  const esValido = esSalsasBasicasValido;

  return (
    <div>
      {/* === Salsas gratis (todo en un MISMO recuadro) === */}
  <div className={`rounded-lg border p-3 bg-neutral-900/60 ${!esValido ? 'border-orange-400/50 bg-orange-900/10' : 'border-white/10'}`}>
        <h4 className="font-semibold mb-2 text-neutral-50 text-sm">Incluimos en tu pedido</h4>

        {/* 2 columnas: izquierda Soya/Teri, derecha Jengibre/Wasabi */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Izquierda: Soya/Teriyaki */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">
              Soya/Teriyaki:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisBasicas}</span>
            </p>
            
            {/* Checkbox Sin salsas básicas */}
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-neutral-200">Sin salsas Soya/Teriyaki</div>
              <div>
                <Toggle
                  ariaLabel="Sin salsas Soya/Teriyaki"
                  checked={sinSalsasBasicas}
                  onChange={(checked) => {
                    setSinSalsasBasicas(checked);
                    if (checked) {
                      dispatch({ type: "SET_FIELD", field: "soya", value: 0 });
                      dispatch({ type: "SET_FIELD", field: "teriyaki", value: 0 });
                    }
                  }}
                />
              </div>
            </div>

            {!sinSalsasBasicas && (
              <div className="grid grid-cols-2 gap-2">
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
            <p className="text-xs text-neutral-400 mb-1">
              Jengibre/Wasabi:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisJWas}</span>
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-200">Incluir Jengibre</div>
                <Toggle
                  ariaLabel="Incluir Jengibre"
                  checked={jengibreSelected}
                  disabled={!jengibreSelected && wasabiSelected && maxGratisJWas <= 1}
                  onChange={handleToggleJengibre}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-200">Incluir Wasabi</div>
                <Toggle
                  ariaLabel="Incluir Wasabi"
                  checked={wasabiSelected}
                  disabled={!wasabiSelected && jengibreSelected && maxGratisJWas <= 1}
                  onChange={handleToggleWasabi}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Palitos (gratis) debajo de ambas columnas, MISMO recuadro */}
        <div className="mt-3 pt-2 border-t border-white/10">
          <div className="flex items-end gap-2">
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


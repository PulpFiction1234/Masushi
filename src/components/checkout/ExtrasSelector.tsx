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
  /** opcional: pool gratis para jengibre/wasabi (default 2) */
  maxGratisJWas?: number;
}

export default function ExtrasSelector({
  state,
  dispatch,
  maxGratisBasicas,
  maxGratisJWas = 2,
}: Props) {
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

  return (
    <div>
      {/* === Salsas gratis (todo en un MISMO recuadro) === */}
      <div className="rounded-xl border border-white/10 p-3 bg-neutral-900/60">
        <h4 className="font-semibold mb-3 text-neutral-50">Salsas gratis del pedido</h4>

        {/* 2 columnas: izquierda Soya/Teri, derecha Jengibre/Wasabi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Izquierda: Soya/Teriyaki */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">
              Gratis Soya/Teriyaki:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisBasicas}</span> • Usadas:{" "}
              <span className="font-semibold text-neutral-200">{usados}</span> • Quedan:{" "}
              <span className="font-semibold text-neutral-200">{restantes}</span>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="soya" className="block text-sm font-medium text-neutral-200 mb-1">
                  Soya (gratis)
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
              <div>
                <label htmlFor="teriyaki" className="block text-sm font-medium text-neutral-200 mb-1">
                  Teriyaki (gratis)
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
          </div>

          {/* Derecha: Jengibre/Wasabi */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">
              Gratis Jengibre/Wasabi:{" "}
              <span className="font-semibold text-neutral-200">{maxGratisJWas}</span> • Usadas:{" "}
              <span className="font-semibold text-neutral-200">{usadosJW}</span> • Quedan:{" "}
              <span className="font-semibold text-neutral-200">{restantesJW}</span>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="jengibreFree" className="block text-sm font-medium text-neutral-200 mb-1">
                  Jengibre (gratis)
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
              <div>
                <label htmlFor="wasabiFree" className="block text-sm font-medium text-neutral-200 mb-1">
                  Wasabi (gratis)
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
          </div>
        </div>

        {/* Palitos (gratis) debajo de ambas columnas, MISMO recuadro */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <label htmlFor="palitos" className="block text-sm font-medium text-neutral-200 mb-1">
            Palitos (gratis)
          </label>
          <input
            id="palitos"
            type="number"
            min={0}
            value={state.palitos}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "palitos",
                value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
              })
            }
            className={smallInput}
          />
        </div>
      </div>

      {/* === Extras cobrados === */}
      <div className="mt-4 rounded-xl border border-white/10 p-3 bg-neutral-900/60">
        <h4 className="font-semibold mb-3 text-neutral-50">Extras (se cobran)</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="soyaExtra" className="block text-sm font-medium text-neutral-200 mb-1">
              Soya extra ({fmt(PRECIO_SOYA_EXTRA)} c/u)
            </label>
            <input
              id="soyaExtra"
              type="number"
              min={0}
              value={state.soyaExtra}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "soyaExtra",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>

          <div>
            <label htmlFor="teriyakiExtra" className="block text-sm font-medium text-neutral-200 mb-1">
              Teriyaki extra ({fmt(PRECIO_TERIYAKI_EXTRA)} c/u)
            </label>
            <input
              id="teriyakiExtra"
              type="number"
              min={0}
              value={state.teriyakiExtra}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "teriyakiExtra",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>

          <div>
            <label htmlFor="acevichada" className="block text-sm font-medium text-neutral-200 mb-1">
              Acevichada ({fmt(PRECIO_ACEVICHADA)} c/u)
            </label>
            <input
              id="acevichada"
              type="number"
              min={0}
              value={state.acevichada}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "acevichada",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>

          <div>
            <label htmlFor="maracuya" className="block text-sm font-medium text-neutral-200 mb-1">
              Maracuyá ({fmt(PRECIO_MARACUYA)} c/u)
            </label>
            <input
              id="maracuya"
              type="number"
              min={0}
              value={state.maracuya}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "maracuya",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>

          <div>
            <label htmlFor="extra-jengibre" className="block text-sm font-medium text-neutral-200 mb-1">
              Extra jengibre ({fmt(PRECIO_JENGIBRE_EXTRA)} c/u)
            </label>
            <input
              id="extra-jengibre"
              type="number"
              min={0}
              value={state.extraJengibre}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "extraJengibre",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
          </div>

          <div>
            <label htmlFor="extra-wasabi" className="block text-sm font-medium text-neutral-200 mb-1">
              Extra wasabi ({fmt(PRECIO_WASABI_EXTRA)} c/u)
            </label>
            <input
              id="extra-wasabi"
              type="number"
              min={0}
              value={state.extraWasabi}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "extraWasabi",
                  value: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                })
              }
              className={smallInput}
            />
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

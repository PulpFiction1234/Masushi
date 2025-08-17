import { fmt, PRECIO_ACEVICHADA, PRECIO_JENGIBRE_EXTRA, PRECIO_MARACUYA, PRECIO_WASABI_EXTRA, CheckoutState, CheckoutAction } from "@/utils/checkout";
import React from "react";

const smallInput =
  "border border-white/10 bg-neutral-800/80 rounded-xl w-24 px-2 py-1 text-center text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500";
const inputBase =
  "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

interface Props {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
}

export default function ExtrasSelector({ state, dispatch }: Props) {
  return (
    <div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="soya" className="block text-sm font-medium text-neutral-200 mb-1">
            Soya
          </label>
          <input
            id="soya"
            type="number"
            min={0}
            value={state.soya}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "soya",
                value: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={smallInput}
          />
        </div>
        <div>
          <label htmlFor="teriyaki" className="block text-sm font-medium text-neutral-200 mb-1">
            Teriyaki
          </label>
          <input
            id="teriyaki"
            type="number"
            min={0}
            value={state.teriyaki}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "teriyaki",
                value: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={smallInput}
          />
        </div>
        <div>
          <label htmlFor="acevichada" className="block text-sm font-medium text-neutral-200 mb-1">
            Acevichada ({fmt(PRECIO_ACEVICHADA)})
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
                value: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={smallInput}
          />
        </div>
        <div>
          <label htmlFor="maracuya" className="block text-sm font-medium text-neutral-200 mb-1">
            Maracuyá ({fmt(PRECIO_MARACUYA)})
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
                value: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={smallInput}
          />
        </div>
        <div>
          <label htmlFor="palitos" className="block text-sm font-medium text-neutral-200 mb-1">
            Palitos
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
                value: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={smallInput}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 p-3 bg-neutral-900/60">
        <h4 className="font-semibold mb-2 text-neutral-50">Jengibre y Wasabi</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 p-3 bg-neutral-900/60">
            <label className="flex items-center gap-2 text-sm text-neutral-200 mb-2">
              <input
                type="checkbox"
                checked={state.jengibre}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "jengibre",
                    value: e.target.checked,
                  })
                }
              />
              Jengibre (1 sin costo)
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor="extra-jengibre" className="text-sm text-neutral-300">
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
                    value: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className={smallInput}
              />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3 bg-neutral-900/60">
            <label className="flex items-center gap-2 text-sm text-neutral-200 mb-2">
              <input
                type="checkbox"
                checked={state.wasabi}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "wasabi",
                    value: e.target.checked,
                  })
                }
              />
              Wasabi (1 sin costo)
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor="extra-wasabi" className="text-sm text-neutral-300">
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
                    value: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className={smallInput}
              />
            </div>
          </div>
        </div>
      </div>

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
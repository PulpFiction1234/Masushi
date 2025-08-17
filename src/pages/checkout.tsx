"use client";
import { useMemo, useReducer } from "react";
import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

// Turf liviano
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { polygon as turfPolygon, point as turfPoint } from "@turf/helpers";

// ====== THEME (ajústalo si quieres) ======
const ACCENT_FROM = "from-emerald-500";
const ACCENT_TO = "to-green-600";

const polygonCoords: [number, number][] = [
  [-70.55333580871932, -33.55164650027345],
  [-70.55154892059005, -33.57103147569347],
  [-70.543126064682, -33.57526845824594],
  [-70.54335260525912, -33.579863227905676],
  [-70.53678356144749, -33.58047008503006],
  [-70.53337762319231, -33.57086746107795],
  [-70.54349539985247, -33.57053509992138],
  [-70.54223803050587, -33.56378634812889],
  [-70.54093580451473, -33.55922636786575],
  [-70.54771552487533, -33.55773757517649],
  [-70.5473367908388, -33.555186900807314],
  [-70.54868789618696, -33.55452682841976],
  [-70.54896896768896, -33.55297430982432],
];

import {
  fmt,
  toShortCLAddress,
  REGEX_NUMERO_CALLE,
  isValidChileanMobile,
  paymentLabel,
  CartItemLike,
  priceOf,
  codePartOf,
  nameWithTipo,
  splitFreeEvenly,
  checkoutReducer,
  initialCheckoutState,
  PRECIO_SOYA_EXTRA,
  PRECIO_TERIYAKI_EXTRA,
  PRECIO_ACEVICHADA,
  PRECIO_MARACUYA,
  PRECIO_JENGIBRE_EXTRA,
  PRECIO_WASABI_EXTRA,
  COSTO_DELIVERY,
} from "@/utils/checkout";
import SummaryPanel from "@/components/checkout/SummaryPanel";
import PaymentSelector from "@/components/checkout/PaymentSelector";

const AddressSearch = dynamic(() => import("../components/AddressSearch"), {
  ssr: false,
});

export default function Checkout() {
  const { cart } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);
  const {
    name,
    lastName,
    phone,
    deliveryType,
    address,
    coords,
    soya,
    teriyaki,
    acevichada,
    maracuya,
    palitos,
    jengibre,
    wasabi,
    extraJengibre,
    extraWasabi,
    observacion,
    paymentMethod,
  } = state;

  const subtotalProductos = useMemo(
    () => cart.reduce((acc, it) => acc + priceOf(it as CartItemLike) * (it as CartItemLike).cantidad, 0),
    [cart]
  );

  const zonaPolygon = useMemo(() => turfPolygon([[...polygonCoords, polygonCoords[0]]]), []);

  const {
    totalProductos,
    freeOnSoya,
    freeOnTeriyaki,
    paidSoya,
    paidTeriyaki,
    totalAcevichada,
    totalMaracuya,
    costoJengibreExtras,
    costoWasabiExtras,
    deliveryFee,
    totalFinal,
  } = useMemo(() => {
    const prod = subtotalProductos;
    const gratis = cart.reduce((sum, item: CartItemLike) => sum + item.cantidad, 0);
    const soyaCount = Number(soya || 0);
    const teriCount = Number(teriyaki || 0);
    const { freeSoya, freeTeri } = splitFreeEvenly(soyaCount, teriCount, gratis);

    const pSoya = Math.max(0, soyaCount - freeSoya);
    const pTeri = Math.max(0, teriCount - freeTeri);
    const costoBasicas = pSoya * PRECIO_SOYA_EXTRA + pTeri * PRECIO_TERIYAKI_EXTRA;

    const ace = Number(acevichada || 0) * PRECIO_ACEVICHADA;
    const mar = Number(maracuya || 0) * PRECIO_MARACUYA;

    const eJen = Number(extraJengibre || 0) * PRECIO_JENGIBRE_EXTRA;
    const eWas = Number(extraWasabi || 0) * PRECIO_WASABI_EXTRA;

    const fee = deliveryType === "delivery" ? COSTO_DELIVERY : 0;

    return {
      totalProductos: prod,
      freeOnSoya: freeSoya,
      freeOnTeriyaki: freeTeri,
      paidSoya: pSoya,
      paidTeriyaki: pTeri,
      totalAcevichada: ace,
      totalMaracuya: mar,
      costoJengibreExtras: eJen,
      costoWasabiExtras: eWas,
      deliveryFee: fee,
      totalFinal: prod + costoBasicas + ace + mar + eJen + eWas + fee,
    };
  }, [subtotalProductos, cart, soya, teriyaki, acevichada, maracuya, extraJengibre, extraWasabi, deliveryType]);

  const canSubmit =
    name.trim().length > 1 &&
    lastName.trim().length > 1 &&
    isValidChileanMobile(phone) &&
    paymentMethod !== "" &&
    (deliveryType === "retiro" || (coords && REGEX_NUMERO_CALLE.test(address)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { alert("Tu carrito está vacío"); return; }
    if (deliveryType === "delivery") {
      if (!coords) { alert("Ingrese una dirección válida."); return; }
      if (!REGEX_NUMERO_CALLE.test(address)) { alert("Debe ingresar un número de domicilio (ej.: N° 1234 o #1234)."); return; }
      const inside = booleanPointInPolygon(turfPoint(coords), zonaPolygon);
      if (!inside) { alert("Lo sentimos, tu dirección está fuera de la zona de reparto."); return; }
    }

    const productosTexto = (cart as unknown as CartItemLike[])
      .map((item) => {
        const lineaNombre = `${codePartOf(item)}${nameWithTipo(item)}`;
        const totalLinea = fmt(priceOf(item) * item.cantidad);
        return ` ${lineaNombre} x${item.cantidad} — ${totalLinea}`;
      })
      .join("\n");

    const extrasBasicasLineas = [
      `Soya: ${Number(soya || 0)} (gratis: ${freeOnSoya}, pagas: ${paidSoya} = ${fmt(paidSoya * PRECIO_SOYA_EXTRA)})`,
      `Teriyaki: ${Number(teriyaki || 0)} (gratis: ${freeOnTeriyaki}, pagas: ${paidTeriyaki} = ${fmt(paidTeriyaki * PRECIO_TERIYAKI_EXTRA)})`,
    ];

    const extrasTexto = [
      ...extrasBasicasLineas,
      `Acevichada: ${Number(acevichada || 0)} = ${fmt(totalAcevichada)}`,
      `Maracuyá: ${Number(maracuya || 0)} = ${fmt(totalMaracuya)}`,
      `Jengibre: ${jengibre ? "Sí" : "No"}`,
      `Wasabi: ${wasabi ? "Sí" : "No"}`,
      `Extra jengibre: ${Number(extraJengibre || 0)} = ${fmt(costoJengibreExtras)}`,
      `Extra wasabi: ${Number(extraWasabi || 0)} = ${fmt(costoWasabiExtras)}`,
      palitos !== "" ? `Palitos: ${Number(palitos || 0)}` : "",
      deliveryType === "delivery" ? `Delivery: ${fmt(deliveryFee)}` : "",
      observacion ? `Observaciones: ${observacion}` : "",
    ].filter(Boolean).join("\n");

    const shortAddress = toShortCLAddress(address);
    const msg =
      `Tipo: ${deliveryType}\n` +
      (deliveryType === "delivery" ? `Dirección: ${shortAddress}\n` : "") +
      `Nombre: ${name} ${lastName}\n` +
      `Teléfono: ${phone}\n` +
      `Método de pago: ${paymentLabel(paymentMethod)}\n` +
      `\n--- Productos ---\n${productosTexto}\n` +
      `\n--- Extras ---\n${extrasTexto}\n` +
      `\nTotal: ${fmt(totalFinal)}`;
    const mensaje = encodeURIComponent(msg);
    window.open(`https://wa.me/56951869402?text=${mensaje}`, "_blank");
  };

  // ====== UI oscuro ======
  const inputBase = "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="mb-6">
            <div className={`mt-2 h-1 w-24 bg-gradient-to-r ${ACCENT_FROM} ${ACCENT_TO} rounded-full`} />
          </div>

          <div className="flex justify-center">
            <form onSubmit={handleSubmit} className={`${card} w-full max-w-2xl p-5 space-y-5`}>
              {cart.length > 0 && (
                <SummaryPanel
                  cart={cart as unknown as CartItemLike[]}
                  state={state}
                  dispatch={dispatch}
                  subtotalProductos={totalProductos}
                  deliveryType={deliveryType}
                  deliveryFee={deliveryFee}
                />
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-base font-semibold">Total final</p>
                <p className="text-xl font-bold">{fmt(totalFinal)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block font-medium mb-1 text-neutral-200">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={inputBase}
                    value={name}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className="block font-medium mb-1 text-neutral-200">Apellido</label>
                  <input
                    id="lastname"
                    type="text"
                    className={inputBase}
                    value={lastName}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "lastName", value: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block font-medium mb-1 text-neutral-200">Teléfono (Chile)</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  className={inputBase}
                  value={phone}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "phone", value: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  required
                />
                {!isValidChileanMobile(phone) && phone.trim() !== "" && (
                  <p className="text-xs text-red-300 mt-1">Ingresa un celular chileno válido (+56 9 ########).</p>
                )}
              </div>

              <div>
                <label htmlFor="tipo" className="block font-medium mb-1 text-neutral-200">Tipo de entrega</label>
                <select
                  id="tipo"
                  className={inputBase}
                  value={deliveryType}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "deliveryType", value: e.target.value as "retiro" | "delivery" })}
                >
                  <option value="retiro">Retiro en tienda</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <PaymentSelector paymentMethod={paymentMethod} dispatch={dispatch} />

              {deliveryType === "delivery" && (
                <div>
                  <label htmlFor="addr" className="block font-medium mb-1 text-neutral-200">Dirección</label>
                  <div id="addr" className="w-full">
                    <AddressSearch
                      polygonCoords={polygonCoords}
                      onValidAddress={(addr, crds) => {
                        dispatch({ type: "SET_FIELD", field: "address", value: addr });
                        dispatch({ type: "SET_FIELD", field: "coords", value: crds });
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full rounded-xl px-4 py-2 font-medium text-white bg-gradient-to-b ${ACCENT_FROM} ${ACCENT_TO} shadow hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                Hacer pedido
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

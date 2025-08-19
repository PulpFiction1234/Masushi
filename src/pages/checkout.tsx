"use client";
import { useMemo, useReducer } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

// Turf liviano
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { polygon as turfPolygon, point as turfPoint } from "@turf/helpers";

// THEME
const ACCENT_FROM = "from-emerald-500";
const ACCENT_TO = "to-green-600";

// SWR fetcher
const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

const polygonCoords: [number, number][] = [
  [-70.56792278176697, -33.54740779939201],
  [-70.56795996097195, -33.54755552978167],
  [-70.56526009874807, -33.550979938611576],
  [-70.56097330972894, -33.55614429630663],
  [-70.55737100120183, -33.560524892398185],
  [-70.55556150826365, -33.56228288015923],
  [-70.55498613954133, -33.563130592693824],
  [-70.5551523086769, -33.565217030723645],
  [-70.55443227233101, -33.56772831961308],
  [-70.5547305731032, -33.57077090965853],
  [-70.5514494051552, -33.571230983645044],
  [-70.54341983705648, -33.57509114592355],
  [-70.54356070667232, -33.57655170285245],
  [-70.5432789674406, -33.578260001473375],
  [-70.53956940089168, -33.578129598190756],
  [-70.53573461690691, -33.57876857239407],
  [-70.53319896382233, -33.5702797386767],
  [-70.53958505307084, -33.57108830938216],
  [-70.53959602582664, -33.56935743994629],
  [-70.540395738594, -33.56697764165178],
  [-70.5438345034943, -33.56735841378612],
  [-70.54351461838733, -33.56613041762654],
  [-70.54351461838733, -33.56383505844693],
  [-70.54212083327809, -33.56399689269894],
  [-70.54175525029913, -33.56303540239644],
  [-70.53943608327317, -33.56329243550561],
  [-70.53888770880387, -33.5623023778453],
  [-70.53827595139298, -33.56256495276565],
  [-70.53594655760544, -33.56076113603887],
  [-70.53469950840608, -33.55925139090406],
  [-70.53451127456464, -33.557663188967496],
  [-70.53274658230208, -33.557623973735275],
  [-70.53145247464218, -33.555133770038815],
  [-70.5312407115705, -33.55232975396894],
  [-70.53439362841395, -33.55240818922245],
  [-70.53538185608107, -33.55495729618671],
  [-70.53493480070803, -33.55625142939673],
  [-70.53540538531136, -33.559486677595906],
  [-70.53811124678178, -33.56170226251008],
  [-70.54098181286277, -33.56138855482583],
  [-70.54015828980681, -33.55934942710351],
  [-70.5475229388517, -33.557663188967496],
  [-70.54717000039903, -33.555369067947204],
  [-70.54728764654972, -33.55482003849701],
  [-70.54855822533308, -33.554016096212436],
  [-70.54874645917386, -33.552819973125786],
  [-70.55328760059763, -33.55125126200772],
  [-70.55385230212198, -33.551212043865725],
  [-70.55406406519371, -33.54942759953093],
  [-70.55681698512399, -33.54936877106851],
  [-70.55676992666348, -33.54776077757733],
  [-70.56792278176697, -33.54740779939201],
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

// Catálogo (para salsasGratis / categoría)
import { productos } from "@/data/productos";
type ProductoMin = { id: number; categoria?: string; salsasGratis?: number };

const AddressSearch = dynamic(() => import("../components/AddressSearch"), { ssr: false });

// Index por id del catálogo
const byId = new Map(productos.map((p) => [p.id, p]));

// Salsas gratis por unidad según catálogo (sin `any`)
const salsasGratisPorUnidad = (it: CartItemLike): number => {
  const p = byId.get(it.id) as ProductoMin | undefined;
  if (p && typeof p.salsasGratis === "number") return Math.max(0, p.salsasGratis);
  // Fallback seguro: si no hay catálogo, asumimos 1 (bebidas en catálogo ya tienen 0).
  return 1;
};

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
    soyaExtra,
    teriyakiExtra,
    acevichada,
    maracuya,
    palitos,
    jengibre, // pool gratis J/W (como número)
    wasabi,   // pool gratis J/W (como número)
    extraJengibre,
    extraWasabi,
    observacion,
    paymentMethod,
  } = state;

  // Estado de apertura desde /api/open (refresca cada 60s)
  const { data: openData } = useSWR("/api/open", fetcher, { refreshInterval: 60_000 });
  const abierto = openData?.abierto === true;
  const statusLabel =
    abierto
      ? openData?.nextClose
        ? `Abierto • cierra ${openData.nextClose.human}`
        : "Abierto"
      : openData?.nextOpen
      ? `Cerrado • abrimos ${openData.nextOpen.human}`
      : "Cerrado";

  // Cart tipado
  const cartTyped = useMemo(() => cart as unknown as CartItemLike[], [cart]);

  const subtotalProductos = useMemo(
    () =>
      cartTyped.reduce(
        (acc, it) => acc + priceOf(it) * it.cantidad,
        0
      ),
    [cartTyped]
  );

  const zonaPolygon = useMemo(() => turfPolygon([[...polygonCoords, polygonCoords[0]]]), []);

  // Pool gratis J/W fijo en 2
  const POOL_JW = 2;

  // Cálculos monetarios/totales
  const {
    totalProductos,
    freeSoya,
    freeTeri,
    paidSoya,
    paidTeri,
    totalAcevichada,
    totalMaracuya,
    costoSoyaExtra,
    costoTeriExtra,
    costoJengibreExtras,
    costoWasabiExtras,
    deliveryFee,
    totalFinal,
    gratisBasicas,
  } = useMemo(() => {
    const prod = subtotalProductos;

    // Pool de salsas gratis (soya/teriyaki) según catálogo
    const gratis = cartTyped.reduce(
      (sum, item) => sum + salsasGratisPorUnidad(item) * item.cantidad,
      0
    );

    const soyaG = Number(soya || 0);
    const teriG = Number(teriyaki || 0);
    const usados = soyaG + teriG;
    const capSoya = Math.max(0, gratis - teriG);
    const capTeri = Math.max(0, gratis - soyaG);
    const freeS = Math.min(soyaG, capSoya);
    const freeT = Math.min(teriyaki || 0, capTeri);

    const pSoya = Math.max(0, soyaG - freeS);
    const pTeri = Math.max(0, (Number(teriyaki || 0)) - freeT);

    const costoSoya = pSoya * PRECIO_SOYA_EXTRA;
    const costoTeri = pTeri * PRECIO_TERIYAKI_EXTRA;

    const ace = Number(acevichada || 0) * PRECIO_ACEVICHADA;
    const mar = Number(maracuya || 0) * PRECIO_MARACUYA;

    const eJen = Number(extraJengibre || 0) * PRECIO_JENGIBRE_EXTRA;
    const eWas = Number(extraWasabi || 0) * PRECIO_WASABI_EXTRA;

    // extras explícitos de soya/teriyaki
    const costoSoyaPlus = Number(soyaExtra || 0) * PRECIO_SOYA_EXTRA;
    const costoTeriPlus = Number(teriyakiExtra || 0) * PRECIO_TERIYAKI_EXTRA;

    const fee = deliveryType === "delivery" ? COSTO_DELIVERY : 0;

    const total =
      prod +
      costoSoya +
      costoTeri +
      costoSoyaPlus +
      costoTeriPlus +
      ace +
      mar +
      eJen +
      eWas +
      fee;

    return {
      totalProductos: prod,
      freeSoya: freeS,
      freeTeri: freeT,
      paidSoya: pSoya,
      paidTeri: pTeri,
      totalAcevichada: ace,
      totalMaracuya: mar,
      costoSoyaExtra: costoSoya + costoSoyaPlus,
      costoTeriExtra: costoTeri + costoTeriPlus,
      costoJengibreExtras: eJen,
      costoWasabiExtras: eWas,
      deliveryFee: fee,
      totalFinal: total,
      gratisBasicas: gratis,
    };
  }, [
    subtotalProductos,
    cartTyped,
    soya,
    teriyaki,
    soyaExtra,
    teriyakiExtra,
    acevichada,
    maracuya,
    extraJengibre,
    extraWasabi,
    deliveryType,
  ]);

  const canSubmitBase =
    name.trim().length > 1 &&
    lastName.trim().length > 1 &&
    isValidChileanMobile(phone) &&
    paymentMethod !== "" &&
    (deliveryType === "retiro" || (coords && REGEX_NUMERO_CALLE.test(address)));

  const canSubmit = canSubmitBase && abierto === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cartTyped.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    // Verificación inmediata en servidor
    fetch("/api/open", { cache: "no-store" })
      .then((r) => r.json())
      .then((od) => {
        if (!od?.abierto) {
          alert(
            od?.nextOpen?.human
              ? `Estamos cerrados. Abrimos ${od.nextOpen.human}.`
              : "Estamos cerrados en este momento."
          );
          return;
        }

        if (deliveryType === "delivery") {
          if (!coords) {
            alert("Ingrese una dirección válida.");
            return;
          }
          if (!REGEX_NUMERO_CALLE.test(address)) {
            alert("Debe ingresar un número de domicilio (ej.: N° 1234 o #1234).");
            return;
          }
          const inside = booleanPointInPolygon(turfPoint(coords), zonaPolygon);
          if (!inside) {
            alert("Lo sentimos, tu dirección está fuera de la zona de reparto.");
            return;
          }
        }

        const productosTexto = cartTyped
          .map((item) => {
            const lineaNombre = `${codePartOf(item)}${nameWithTipo(item)}`;
            const totalLinea = fmt(priceOf(item) * item.cantidad);
            return ` ${lineaNombre} x${item.cantidad} — ${totalLinea}`;
          })
          .join("\n");

        const extrasBasicasLineas = [
          `Soya (gratis): ${Number(soya || 0)}`,
          `Teriyaki (gratis): ${Number(teriyaki || 0)}`,
          `Soya extra: ${Number(soyaExtra || 0)} = ${fmt(Number(soyaExtra || 0) * PRECIO_SOYA_EXTRA)}`,
          `Teriyaki extra: ${Number(teriyakiExtra || 0)} = ${fmt(
            Number(teriyakiExtra || 0) * PRECIO_TERIYAKI_EXTRA
          )}`,
        ];

        const jwGratisLineas = [
          `Jengibre (gratis): ${Number(jengibre || 0)}/${POOL_JW}`,
          `Wasabi (gratis): ${Number(wasabi || 0)}/${POOL_JW}`,
        ];

        const extrasTexto = [
          ...extrasBasicasLineas,
          ...jwGratisLineas,
          `Acevichada: ${Number(acevichada || 0)} = ${fmt(totalAcevichada)}`,
          `Maracuyá: ${Number(maracuya || 0)} = ${fmt(totalMaracuya)}`,
          `Extra jengibre: ${Number(extraJengibre || 0)} = ${fmt(costoJengibreExtras)}`,
          `Extra wasabi: ${Number(extraWasabi || 0)} = ${fmt(costoWasabiExtras)}`,
          `Palitos (gratis): ${Number(palitos || 0)}`,
          deliveryType === "delivery" ? `Delivery: ${fmt(deliveryFee)}` : "",
          observacion ? `Observaciones: ${observacion}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const shortAddress = toShortCLAddress(address);
        const msg =
          `Tipo: ${deliveryType}\n` +
          (deliveryType === "delivery" ? `Dirección: ${shortAddress}\n` : "") +
          `Nombre: ${name} ${lastName}\n` +
          `Teléfono: ${phone}\n` +
          `Método de pago: ${paymentLabel(paymentMethod)}\n` +
          `\n--- Productos ---\n${productosTexto}\n` +
          `\n--- Salsas y extras ---\n${extrasTexto}\n` +
          `\nTotal: ${fmt(totalFinal)}`;
        const mensaje = encodeURIComponent(msg);
        window.open(`https://wa.me/56951869402?text=${mensaje}`, "_blank");
      })
      .catch(() => alert("No se pudo verificar el estado del local. Intenta de nuevo."));
  };

  // UI
  const inputBase =
    "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
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
              {/* Estado de apertura */}
              <div className="rounded-xl bg-neutral-800/70 border border-white/10 p-3 text-sm flex items-center justify-between">
                <span className={abierto ? "text-emerald-300" : "text-amber-300"}>{statusLabel}</span>
                {openData?.timeZone && <span className="text-neutral-400"></span>}
              </div>

              {cartTyped.length > 0 && (
                <SummaryPanel
                  cart={cartTyped}
                  state={state}
                  dispatch={dispatch}
                  subtotalProductos={totalProductos}
                  deliveryType={deliveryType}
                  deliveryFee={deliveryFee}
                  maxGratisBasicas={gratisBasicas}
                  maxGratisJWas={POOL_JW}
                />
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-base font-semibold">Total final</p>
                <p className="text-xl font-bold">{fmt(totalFinal)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block font-medium mb-1 text-neutral-200">
                    Nombre
                  </label>
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
                  <label htmlFor="lastname" className="block font-medium mb-1 text-neutral-200">
                    Apellido
                  </label>
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
                <label htmlFor="phone" className="block font-medium mb-1 text-neutral-200">
                  Teléfono (Chile)
                </label>
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
                <label htmlFor="tipo" className="block font-medium mb-1 text-neutral-200">
                  Tipo de entrega
                </label>
                <select
                  id="tipo"
                  className={inputBase}
                  value={deliveryType}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "deliveryType", value: e.target.value as "retiro" | "delivery" })
                  }
                >
                  <option value="retiro">Retiro en tienda</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <PaymentSelector paymentMethod={paymentMethod} dispatch={dispatch} />

              {deliveryType === "delivery" && (
                <div>
                  <label htmlFor="addr" className="block font-medium mb-1 text-neutral-200">
                    Dirección
                  </label>
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
                {abierto === false
                  ? openData?.nextOpen
                    ? `Cerrado • abrimos ${openData.nextOpen.human}`
                    : "Cerrado"
                  : "Hacer pedido"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

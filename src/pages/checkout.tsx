import { useMemo, useState } from "react";
import AddressSearch from "../components/AddressSearch";
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

// PRECIOS
const PRECIO_SOYA_EXTRA = 400;
const PRECIO_TERIYAKI_EXTRA = 1000;
const PRECIO_ACEVICHADA = 1200;
const PRECIO_MARACUYA = 1100;
const PRECIO_JENGIBRE_EXTRA = 500;
const PRECIO_WASABI_EXTRA = 400;
const COSTO_DELIVERY = 1500;

// Helpers
const nfCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const fmt = (n: number) => nfCLP.format(n);

// Dirección corta “Calle 1234, Comuna”
const toShortCLAddress = (addr: string) => {
  const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : addr.trim();
};

// Regex número de calle Chile
const REGEX_NUMERO_CALLE = /(?:^|\s)(?:N°|No\.?|#)?\s*\d{1,5}[A-Za-z]?(?:-\d{1,4})?(?=\s|,|$)/;

// Teléfono Chile
const normalizePhone = (raw: string) => raw.replace(/\D+/g, "");
const isValidChileanMobile = (raw: string) => {
  const compact = raw.replace(/\s+/g, "");
  const digits = normalizePhone(raw);
  return /^(\+?56)?9\d{8}$/.test(compact) || /^569\d{8}$/.test(digits) || /^9\d{8}$/.test(digits);
};

// Nuevo: tipo para método de pago (en local)
type PaymentMethod = "" | "efectivo" | "debito" | "credito" | "transferencia";
const paymentLabel = (pm: PaymentMethod) =>
  pm === "efectivo" ? "Efectivo" :
  pm === "debito" ? "Débito" :
  pm === "credito" ? "Crédito" :
  pm === "transferencia" ? "Transferencia" : "";

export default function Checkout() {
  const { cart, total: carritoTotal } = useCart();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"retiro" | "delivery">("retiro");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);

  const [soya, setSoya] = useState<number | "">("");
  const [teriyaki, setTeriyaki] = useState<number | "">("");
  const [acevichada, setAcevichada] = useState<number | "">("");
  const [maracuya, setMaracuya] = useState<number | "">("");
  const [palitos, setPalitos] = useState<number | "">("");

  // Base (sin costo) y extras pagados:
  const [jengibre, setJengibre] = useState(false);
  const [wasabi, setWasabi] = useState(false);
  const [extraJengibre, setExtraJengibre] = useState<number | "">("");
  const [extraWasabi, setExtraWasabi] = useState<number | "">("");

  const [observacion, setObservacion] = useState("");

  // Nuevo: método de pago en local
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");

  // Polígono zona
  const zonaPolygon = useMemo(() => turfPolygon([[...polygonCoords, polygonCoords[0]]]), []);

  // Reparto gratis equitativo Soya/Teriyaki
  function splitFreeEvenly(s: number, t: number, g: number) {
    if (g <= 0 || s + t === 0) return { freeSoya: 0, freeTeri: 0 };
    const base = Math.floor(g / 2);
    let freeSoya = Math.min(s, base);
    let freeTeri = Math.min(t, base);
    let left = g - freeSoya - freeTeri;
    while (left > 0) {
      const needS = s - freeSoya;
      const needT = t - freeTeri;
      if (needS >= needT && needS > 0) freeSoya++;
      else if (needT > 0) freeTeri++;
      else break;
      left--;
    }
    return { freeSoya, freeTeri };
  }

  // Totales
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
    const prod = carritoTotal;
    const gratis = cart.reduce((sum, item) => sum + item.cantidad, 0);
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
  }, [carritoTotal, cart, soya, teriyaki, acevichada, maracuya, extraJengibre, extraWasabi, deliveryType]);

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

    const productosTexto = cart.map((item) => ` ${item.codigo} | ${item.nombre} x${item.cantidad} — ${fmt(item.valor * item.cantidad)}`).join("\n");

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
      `Método de pago (en local): ${paymentLabel(paymentMethod)}\n` +
      `\n--- Productos ---\n${productosTexto}\n` +
      `\n--- Extras ---\n${extrasTexto}\n` +
      `\nTotal: ${fmt(totalFinal)}`;
    const mensaje = encodeURIComponent(msg);
    window.open(`https://wa.me/56951869402?text=${mensaje}`, "_blank");
  };

  // ====== UI oscuro ======
  const inputBase = "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const smallInput = "border border-white/10 bg-neutral-800/80 rounded-xl w-24 px-2 py-1 text-center text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500";
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
                <div className={`${card} p-4 bg-neutral-900`}>
                  <h3 className="font-bold mb-3 text-neutral-50">Tu carrito</h3>
                  <div className="space-y-1">
                    {cart.map((item) => (
                      <div key={item.id} className="text-sm text-neutral-200 flex items-center justify-between">
                        <span>{item.nombre} (x{item.cantidad})</span>
                        <span className="font-mono">{fmt(item.valor * item.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
                    <p className="text-sm text-neutral-300">Subtotal productos</p>
                    <p className="font-semibold">{fmt(totalProductos)}</p>
                  </div>

                  <p className="text-xs text-neutral-400 mt-3">
                    Incluye <span className="font-medium text-neutral-200">1 salsa (soya o teriyaki) por producto</span>. Extras: Soya {fmt(PRECIO_SOYA_EXTRA)}, Teriyaki {fmt(PRECIO_TERIYAKI_EXTRA)}.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="soya" className="block text-sm font-medium text-neutral-200 mb-1">Soya</label>
                      <input id="soya" type="number" min={0} value={soya} onChange={(e) => setSoya(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                    </div>
                    <div>
                      <label htmlFor="teriyaki" className="block text-sm font-medium text-neutral-200 mb-1">Teriyaki</label>
                      <input id="teriyaki" type="number" min={0} value={teriyaki} onChange={(e) => setTeriyaki(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                    </div>
                    <div>
                      <label htmlFor="acevichada" className="block text-sm font-medium text-neutral-200 mb-1">Acevichada ({fmt(PRECIO_ACEVICHADA)})</label>
                      <input id="acevichada" type="number" min={0} value={acevichada} onChange={(e) => setAcevichada(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                    </div>
                    <div>
                      <label htmlFor="maracuya" className="block text-sm font-medium text-neutral-200 mb-1">Maracuyá ({fmt(PRECIO_MARACUYA)})</label>
                      <input id="maracuya" type="number" min={0} value={maracuya} onChange={(e) => setMaracuya(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                    </div>
                    <div>
                      <label htmlFor="palitos" className="block text-sm font-medium text-neutral-200 mb-1">Palitos</label>
                      <input id="palitos" type="number" min={0} value={palitos} onChange={(e) => setPalitos(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                    </div>
                  </div>

                  {/* Recuadro Jengibre / Wasabi */}
                  <div className="mt-4 rounded-xl border border-white/10 p-3 bg-neutral-900/60">
                    <h4 className="font-semibold mb-2 text-neutral-50">Jengibre y Wasabi</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/10 p-3 bg-neutral-900/60">
                        <label className="flex items-center gap-2 text-sm text-neutral-200 mb-2">
                          <input type="checkbox" checked={jengibre} onChange={(e) => setJengibre(e.target.checked)} />
                          Jengibre (1 sin costo)
                        </label>
                        <div className="flex items-center gap-2">
                          <label htmlFor="extra-jengibre" className="text-sm text-neutral-300">Extra jengibre ({fmt(PRECIO_JENGIBRE_EXTRA)} c/u)</label>
                          <input id="extra-jengibre" type="number" min={0} value={extraJengibre} onChange={(e) => setExtraJengibre(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-3 bg-neutral-900/60">
                        <label className="flex items-center gap-2 text-sm text-neutral-200 mb-2">
                          <input type="checkbox" checked={wasabi} onChange={(e) => setWasabi(e.target.checked)} />
                          Wasabi (1 sin costo)
                        </label>
                        <div className="flex items-center gap-2">
                          <label htmlFor="extra-wasabi" className="text-sm text-neutral-300">Extra wasabi ({fmt(PRECIO_WASABI_EXTRA)} c/u)</label>
                          <input id="extra-wasabi" type="number" min={0} value={extraWasabi} onChange={(e) => setExtraWasabi(e.target.value === "" ? "" : Number(e.target.value))} className={smallInput} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label htmlFor="obs" className="block text-sm font-medium text-neutral-200 mb-1">Observaciones</label>
                    <textarea id="obs" rows={2} className={`${inputBase} resize-none`} placeholder="Ej: sin cebollín, sin nori, etc." value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                    <div className="mt-2 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded p-2">
                      Todo cambio puede llevar un valor extra dependiendo del requerimiento.
                    </div>
                  </div>

                  {deliveryType === "delivery" && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-neutral-300">Delivery</span>
                      <span className="font-semibold">{fmt(deliveryFee)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-base font-semibold">Total final</p>
                <p className="text-xl font-bold">{fmt(totalFinal)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block font-medium mb-1 text-neutral-200">Nombre</label>
                  <input id="name" type="text" className={inputBase} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="lastname" className="block font-medium mb-1 text-neutral-200">Apellido</label>
                  <input id="lastname" type="text" className={inputBase} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block font-medium mb-1 text-neutral-200">Teléfono (Chile)</label>
                <input id="phone" type="tel" inputMode="numeric" className={inputBase} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 1234 5678" required />
                {!isValidChileanMobile(phone) && phone.trim() !== "" && (
                  <p className="text-xs text-red-300 mt-1">Ingresa un celular chileno válido (+56 9 ########).</p>
                )}
              </div>

              <div>
                <label htmlFor="tipo" className="block font-medium mb-1 text-neutral-200">Tipo de entrega</label>
                <select id="tipo" className={inputBase} value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as "retiro" | "delivery")}>
                  <option value="retiro">Retiro en tienda</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* NUEVO: Método de pago en local */}
              <div>
                <label htmlFor="paymethod" className="block font-medium mb-1 text-neutral-200">Método de pago (en local)</label>
                <select
                  id="paymethod"
                  className={inputBase}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  required
                >
                  <option value="">Selecciona una opción…</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <p className="text-xs text-neutral-400 mt-1">Solo informativo — el pago se realiza en el local.</p>
              </div>

              {deliveryType === "delivery" && (
                <div>
                  <label htmlFor="addr" className="block font-medium mb-1 text-neutral-200">Dirección</label>
                  <div id="addr" className="w-full">
                    <AddressSearch
                      polygonCoords={polygonCoords}
                      onValidAddress={(addr, crds) => {
                        setAddress(addr);
                        setCoords(crds);
                        // Para guardar ya corta:
                        // setAddress(toShortCLAddress(addr));
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

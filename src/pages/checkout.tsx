"use client";
import React, { useMemo, useReducer, useEffect } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useCart } from "@/context/CartContext";
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { normalizeImageUrl } from "@/utils/imageHelpers";

// THEME
const ACCENT_FROM = "from-emerald-500";
const ACCENT_TO = "to-green-600";

// Tipado del endpoint /api/status
type StatusApi = {
  timeZone: string;
  abierto: boolean;
  nextOpen: { ymd: string; hhmm: string; human: string } | null;
  nextClose: { ymd: string; hhmm: string; human: string } | null;
  generatedAt: string;
};

// SWR fetcher (fuerza no-cache y evita dedupe agresivo)
const fetcher = (url: string) =>
  fetch(`${url}?t=${Date.now()}`, { cache: "no-store" }).then((r) => r.json() as Promise<StatusApi>);

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
  infoWithTipo,
  checkoutReducer,
  initialCheckoutState,
  PRECIO_SOYA_EXTRA,
  PRECIO_TERIYAKI_EXTRA,
  COSTO_DELIVERY,
  PRECIO_PALITO_EXTRA,
  PRECIO_AYUDA_PALITOS,
  maxPalitosGratisFromCart,
  ProductoMinPalitos,
} from "@/utils/checkout";
import SummaryPanel from "@/components/checkout/SummaryPanel";
import PaymentSelector from "@/components/checkout/PaymentSelector";

// Catálogo
import { productos } from "@/data/productos";
type ProductoMin = { id: number; categoria?: string; salsasGratis?: number };

// 👉 usa alias absoluto (más robusto)
const AddressSearch = dynamic(() => import("@/components/AddressSearch"), { ssr: false });

// Index por id del catálogo
const byId = new Map(productos.map((p) => [p.id, p]));

// Salsas gratis por unidad según catálogo
const salsasGratisPorUnidad = (it: CartItemLike): number => {
  const p = byId.get(it.id) as ProductoMin | undefined;
  if (p && typeof p.salsasGratis === "number") return Math.max(0, p.salsasGratis);
  return 1;
};

export default function Checkout() {
  const { cart } = useCart();
  const user = useUser();
  const { profile } = useUserProfile();
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);
  const [salsasValidas, setSalsasValidas] = React.useState(false);

  const {
    name,
    lastName,
    phone,
    deliveryType,
    address,
    numeroCasa,
    coords,
    soya,
    teriyaki,
    palitos,
    jengibre,
    wasabi,
    palitosExtra,
    ayudaPalitos,
    observacion,
    paymentMethod,
  } = state;

  // Estado de apertura desde /api/status (refresca cada 60s)
  const { data: statusData, isLoading: loadingStatus } = useSWR<StatusApi>(
    "/api/status",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    }
  );

  useEffect(() => {
    if (deliveryType === "retiro" && paymentMethod !== "") {
      dispatch({ type: "SET_FIELD", field: "paymentMethod", value: "" });
    }
  }, [deliveryType, paymentMethod, dispatch]);

  // Autocompletar datos del perfil del usuario si está logueado
  useEffect(() => {
    if (user && profile) {
      // Autocompletar nombre y teléfono si están vacíos
      if (!name && profile.full_name) {
        const nameParts = profile.full_name.split(' ');
        if (nameParts.length >= 2) {
          dispatch({ type: "SET_FIELD", field: "name", value: nameParts[0] });
          dispatch({ type: "SET_FIELD", field: "lastName", value: nameParts.slice(1).join(' ') });
        } else {
          dispatch({ type: "SET_FIELD", field: "name", value: profile.full_name });
        }
      }
      
      if (!phone && profile.phone) {
        dispatch({ type: "SET_FIELD", field: "phone", value: profile.phone });
      }

      // Autocompletar dirección si es delivery y el usuario tiene dirección guardada
      if (deliveryType === "delivery" && !address && profile.address) {
        dispatch({ type: "SET_FIELD", field: "address", value: profile.address });
      }
    }
  }, [user, profile, deliveryType, name, phone, address, dispatch]);

  const abierto = statusData?.abierto === true;
  const statusLabel =
    loadingStatus
      ? "Comprobando horario…"
      : abierto
      ? statusData?.nextClose
        ? `Abierto • cierra ${statusData.nextClose.human}`
        : "Abierto"
      : statusData?.nextOpen
      ? `Cerrado • abrimos ${statusData.nextOpen.human}`
      : "Cerrado";

  // Cart tipado
  const cartTyped = useMemo(() => cart as unknown as CartItemLike[], [cart]);

  const subtotalProductos = useMemo(
    () => cartTyped.reduce((acc, it) => acc + priceOf(it) * it.cantidad, 0),
    [cartTyped]
  );

  // Pool gratis J/W fijo en 2
  const POOL_JW = 2;

  // Tope de palitos gratis desde catálogo
  const maxPalitosGratis = useMemo(
    () => maxPalitosGratisFromCart(cartTyped, byId as Map<number, ProductoMinPalitos>),
    [cartTyped]
  );

  // Cálculos monetarios/totales
  const {
    totalProductos,
    costoPalitosExtra,
    costoAyudaPalitos,
    deliveryFee,
    totalFinal,
    gratisBasicas,
  } = useMemo(() => {
    const prod = subtotalProductos;

    // Pool de salsas gratis según catálogo
    const gratis = cartTyped.reduce(
      (sum, item) => sum + salsasGratisPorUnidad(item) * item.cantidad,
      0
    );

    const soyaG = Number(soya || 0);
    const teriG = Number(teriyaki || 0);

    const capSoya = Math.max(0, gratis - teriG);
    const capTeri = Math.max(0, gratis - soyaG);
    const freeS = Math.min(soyaG, capSoya);
    const freeT = Math.min(teriG, capTeri);

    const pSoya = Math.max(0, soyaG - freeS);
    const pTeri = Math.max(0, teriG - freeT);

    const costoSoya = pSoya * PRECIO_SOYA_EXTRA;
    const costoTeri = pTeri * PRECIO_TERIYAKI_EXTRA;

    // Solo mantener palitos extra y ayuda palitos
    const cPalitosExtra = Number(palitosExtra || 0) * PRECIO_PALITO_EXTRA;
    const cAyudaPalitos = Number(ayudaPalitos || 0) * PRECIO_AYUDA_PALITOS;

    const fee = deliveryType === "delivery" ? COSTO_DELIVERY : 0;

    // Total simplificado: solo productos + salsas gratis cobradas + palitos + delivery
    const total =
      prod +
      costoSoya +
      costoTeri +
      cPalitosExtra +
      cAyudaPalitos +
      fee;

    return {
      totalProductos: prod,
      costoPalitosExtra: cPalitosExtra,
      costoAyudaPalitos: cAyudaPalitos,
      deliveryFee: fee,
      totalFinal: total,
      gratisBasicas: gratis,
    };
  }, [
    subtotalProductos,
    cartTyped,
    soya,
    teriyaki,
    palitosExtra,
    ayudaPalitos,
    deliveryType,
  ]);

  const requiresPayment = deliveryType === "delivery";

  // La validación de salsas se hará en el componente ExtrasSelector con los checkboxes

  const canSubmitBase =
    name.trim().length > 1 &&
    lastName.trim().length > 1 &&
    isValidChileanMobile(phone) &&
    (!requiresPayment || paymentMethod !== "") &&
    // Para delivery: requerimos coords y además un número de domicilio.
    // Aceptamos que el número esté en `address` (REGEX) o que el usuario haya completado `numeroCasa`.
    (deliveryType === "retiro" || (coords && (REGEX_NUMERO_CALLE.test(address) || (numeroCasa && numeroCasa.trim().length > 0)))) &&
    salsasValidas; // ✅ Agregar validación de salsas

  // ⚠️ No permitir enviar si el estado aún está cargando
  const canSubmit = canSubmitBase && abierto === true && !loadingStatus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartTyped.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    // Validar salsas obligatorias
    if (!salsasValidas) {
      alert("Debes seleccionar al menos una salsa de cada tipo o marcar las casillas correspondientes (Sin salsas Soya/Teriyaki o Sin Jengibre/Wasabi)");
      return;
    }

    // Verificación inmediata en servidor contra /api/status
    fetch(`/api/status?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<StatusApi>)
      .then(async (od) => {
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
          // Aceptamos número dentro de la dirección o el campo separado `numeroCasa`
          if (!(REGEX_NUMERO_CALLE.test(address) || (numeroCasa && numeroCasa.trim().length > 0))) {
            alert("Debe ingresar un número de domicilio (ej.: N° 1234 o #1234) o completar el campo N° / Dpto.");
            return;
          }
          const { default: booleanPointInPolygon } = await import("@turf/boolean-point-in-polygon");
          const { polygon, point } = await import("@turf/helpers");
          const zonaPolygon = polygon([[...polygonCoords, polygonCoords[0]]]);
          const inside = booleanPointInPolygon(point(coords), zonaPolygon);
          if (!inside) {
            alert("Lo sentimos, tu dirección está fuera de la zona de reparto.");
            return;
          }
        }

        const productosTexto = cartTyped
          .map((item) => {
            const lineaNombre = `${codePartOf(item)}x ${item.cantidad}  - ${infoWithTipo(item)}`;
            const totalLinea = fmt(priceOf(item) * item.cantidad);
            return ` ${lineaNombre} — ${totalLinea}`;
          })
          .join("\n");

        // ========= Salsas/Palitos =========
        const POOL_JW = 2;
        const nSoya = Number(soya || 0);
        const nTeri = Number(teriyaki || 0);
        const nJenGratis = Number(jengibre || 0);
        const nWasGratis = Number(wasabi || 0);
        const nPalitosGratis = Number(palitos || 0);
        const nPalitosExtra = Number(palitosExtra || 0);
        const nAyudaPalitos = Number(ayudaPalitos || 0);

        const lineasSalsas: string[] = [];
        
        // Solo salsas gratis - las extras ahora son productos normales
        if (nSoya > 0) lineasSalsas.push(`Soya (gratis): ${nSoya}`);
        if (nTeri > 0) lineasSalsas.push(`Teriyaki (gratis): ${nTeri}`);
        if (nJenGratis > 0) lineasSalsas.push(`Jengibre (gratis): ${nJenGratis}/${POOL_JW}`);
        if (nWasGratis > 0) lineasSalsas.push(`Wasabi (gratis): ${nWasGratis}/${POOL_JW}`);
        
        // Agregar líneas para "sin salsas" si corresponde
        if (nSoya === 0 && nTeri === 0) lineasSalsas.push("Sin salsas Soya/Teriyaki");
        if (nJenGratis === 0 && nWasGratis === 0) lineasSalsas.push("Sin Jengibre/Wasabi");

        const lineasPalitos: string[] = [];
        if (nPalitosGratis > 0) lineasPalitos.push(`Palitos (gratis): ${nPalitosGratis}`);
        if (nPalitosExtra > 0) lineasPalitos.push(`Palitos extra: ${nPalitosExtra} = ${fmt(costoPalitosExtra)}`);
        if (nAyudaPalitos > 0) lineasPalitos.push(`Ayuda palitos: ${nAyudaPalitos} = ${fmt(costoAyudaPalitos)}`);

       const bloqueSalsasPalitos =
          [...lineasSalsas, ...lineasPalitos].length > 0
            ? `\n--- Salsas y palitos ---\n${[...lineasSalsas, ...lineasPalitos].join("\n")}\n`
            : "";
        // ========= FIN =========

        const NL = "\r\n";
        const productosTextoCRLF = productosTexto.replace(/\r?\n/g, NL);

        // salto en blanco ANTES del bloque de salsas/palitos (si existe)
        const bloqueSalsasPalitosRaw = bloqueSalsasPalitos ? `\n${bloqueSalsasPalitos}` : "";
        const bloqueSalsasPalitosCRLF = bloqueSalsasPalitosRaw.replace(/\r?\n/g, NL);

        // bloque de Observaciones separado y con encabezado
        const bloqueObsCRLF =
          observacion && observacion.trim()
            ? `${NL}--- Observaciones ---${NL}${observacion.replace(/\r?\n/g, NL)}${NL}`
            : "";

        // Construir dirección corta e incluir número/departamento si el usuario los puso
        const pieces = [toShortCLAddress(address)];
  if (numeroCasa && numeroCasa.trim()) pieces.push(`N° ${numeroCasa.trim()}`);
        const shortAddress = pieces.filter(Boolean).join(", ");
        const lineaDelivery =
          deliveryType === "delivery" ? `Delivery: ${fmt(deliveryFee)}${NL}` : "";

        const cuerpoAntesDeTotal =
          `Tipo: ${deliveryType}${NL}` +
          (deliveryType === "delivery" ? `Dirección: ${shortAddress}${NL}` : "") +
          `Nombre: ${name} ${lastName}${NL}` +
          `Teléfono: ${phone}${NL}` +
          (deliveryType === "delivery" ? `Método de pago: ${paymentLabel(paymentMethod)}${NL}` : "") +
          `${NL}--- Productos ---${NL}${productosTextoCRLF}${NL}` +
          bloqueSalsasPalitosCRLF +
          lineaDelivery +
          bloqueObsCRLF;

        const msg = `${cuerpoAntesDeTotal.replace(/(\r?\n)+$/, "")}${NL}${NL}Total: ${fmt(totalFinal)}`;

        const mensaje = encodeURIComponent(msg);
        
        // Guardar pedido en BD si el usuario está logueado
        let numeroOrden = "";
        if (user) {
          try {
            const orderItems = cartTyped.map((it) => {
              const imagen = normalizeImageUrl(it.imagen);
              return {
                codigo: it.codigo || String(it.id),
                cantidad: it.cantidad,
                opcion: (it as any).opcion || undefined,
                imagen: imagen || undefined,
                blurDataUrl: it.blurDataUrl || undefined,
              };
            });
            const resp = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: orderItems,
                total: totalFinal,
                delivery_type: deliveryType,
                address: deliveryType === "delivery" ? shortAddress : null,
              }),
            });
            const data = await resp.json();
            numeroOrden = data?.orderId ? String(data.orderId) : "";
          } catch (error) {
            console.error("Error saving order:", error);
          }
        }

        // Enviar WhatsApp automatizado con plantilla
        const detallePedido = cartTyped
          .map(item => `${item.cantidad} ${infoWithTipo(item)} $${priceOf(item) * item.cantidad}`)
          .join('\n');
        const { getEstimatedDeliveryTime } = await import("@/utils/deliveryTime");
  const horaEntregaObj = getEstimatedDeliveryTime(new Date(), deliveryType);
  const horaEntrega = horaEntregaObj.maxArrivalTime;
        const direccionFinal = deliveryType === 'retiro' ? 'Retiro en tienda' : shortAddress;
        await fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefono: phone.replace(/\D/g, ""),
            nombre: `${name} ${lastName}`,
            numeroOrden: numeroOrden || "-", // usa el real si está disponible
            horaEntrega,
            direccion: direccionFinal,
            detalle: detallePedido,
            total: totalFinal
          })
        });
      })
      .catch(() => alert("No se pudo verificar el estado del local. Intenta de nuevo."));
  };

  const inputBase =
    "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

  // Definir shortAddress y horaEntregaObj para el render
  const shortAddress = state.address || profile?.address || '';
  const { getEstimatedDeliveryTime } = require("@/utils/deliveryTime");
  const horaEntregaObj = getEstimatedDeliveryTime(new Date(), deliveryType);

  return (
    <>
    <Seo title="Panel de administración — Masushi" canonicalPath="/admin" noIndex />
      <Navbar />
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Selector de despacho/retiro grande y centrado */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-full bg-neutral-800/80 border border-white/10 overflow-hidden shadow-lg">
              <button
                type="button"
                className={`px-8 py-3 text-lg font-semibold transition-colors ${deliveryType === 'delivery' ? 'bg-white/90 text-neutral-900' : 'text-neutral-300'} focus:outline-none`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'deliveryType', value: 'delivery' })}
              >
                Despacho
              </button>
              <button
                type="button"
                className={`px-8 py-3 text-lg font-semibold transition-colors ${deliveryType === 'retiro' ? 'bg-white/90 text-neutral-900' : 'text-neutral-300'} focus:outline-none`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'deliveryType', value: 'retiro' })}
              >
                Retiro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal: Detalles de despacho y formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detalles de despacho */}
              <div className="rounded-2xl bg-neutral-900/80 border border-white/10 p-5 shadow flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600/20 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold text-base text-neutral-200">
                      {deliveryType === 'delivery' ? `Despacho en: ${shortAddress}` : 'Retiro en tienda'}
                    </div>
                    {deliveryType === 'delivery' && (
                      <div className="text-neutral-400 text-sm">{shortAddress}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-600/20 text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-neutral-200">Cuanto antes</span>
                    <span className="text-red-400 text-lg font-bold">{horaEntregaObj?.range?.split('a')[1]?.trim() || ''} min</span>
                  </div>
                </div>
                {/* Mapa o dirección visual */}
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {/* Aquí iría el componente de mapa si existe */}
                  {/* <MapComponent ... /> */}
                </div>
              </div>

              {/* Formulario de datos */}
              <div className="rounded-2xl bg-neutral-900/80 border border-white/10 p-5 shadow">
                <h2 className="text-xl font-bold mb-5 text-neutral-50">Datos del pedido</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block font-medium mb-1 text-neutral-200">Nombre</label>
                      <input id="name" type="text" className={inputBase} value={name} onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })} required />
                    </div>
                    <div>
                      <label htmlFor="lastname" className="block font-medium mb-1 text-neutral-200">Apellido</label>
                      <input id="lastname" type="text" className={inputBase} value={lastName} onChange={(e) => dispatch({ type: "SET_FIELD", field: "lastName", value: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block font-medium mb-1 text-neutral-200">Teléfono (Chile)</label>
                    <input id="phone" type="tel" inputMode="numeric" className={inputBase} value={phone} onChange={(e) => dispatch({ type: "SET_FIELD", field: "phone", value: e.target.value })} placeholder="+56 9 1234 5678" required />
                    {!isValidChileanMobile(phone) && phone.trim() !== "" && (<p className="text-xs text-red-300 mt-1">Ingresa un celular chileno válido (+56 9 ########).</p>)}
                  </div>
                  {/* ...resto del formulario igual... */}
                  {/* ...existing code... */}
                </form>
              </div>
            </div>

            {/* Panel lateral: Resumen de compra */}
            <div className="rounded-2xl bg-neutral-900/90 border border-white/10 p-6 shadow-xl flex flex-col gap-6">
              <h3 className="text-lg font-bold text-neutral-50 mb-2">Detalles de tu compra</h3>
              {/* ...aquí va el resumen del carrito y totales... */}
              {/* ...existing code... */}
              <button className="w-full rounded-xl px-4 py-3 font-bold text-lg text-white bg-gradient-to-b from-red-600 to-red-800 shadow hover:brightness-110 mt-4">Pagar {fmt(totalFinal)}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

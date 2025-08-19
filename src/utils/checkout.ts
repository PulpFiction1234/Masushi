export const PRECIO_SOYA_EXTRA = 400;
export const PRECIO_TERIYAKI_EXTRA = 1000;
export const PRECIO_ACEVICHADA = 1200;
export const PRECIO_MARACUYA = 1100;
export const PRECIO_JENGIBRE_EXTRA = 500;
export const PRECIO_WASABI_EXTRA = 400;
export const COSTO_DELIVERY = 1500;

export const nfCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
export const fmt = (n: number) => nfCLP.format(n);

export const toShortCLAddress = (addr: string) => {
  const parts = addr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : addr.trim();
};

export const REGEX_NUMERO_CALLE =
  /(?:^|\s)(?:N°|No\.?|#)?\s*\d{1,5}[A-Za-z]?(?:-\d{1,4})?(?=\s|,|$)/;

export const normalizePhone = (raw: string) => raw.replace(/\D+/g, "");
export const isValidChileanMobile = (raw: string) => {
  const compact = raw.replace(/\s+/g, "");
  const digits = normalizePhone(raw);
  return (
    /^(\+?56)?9\d{8}$/.test(compact) ||
    /^569\d{8}$/.test(digits) ||
    /^9\d{8}$/.test(digits)
  );
};

export type PaymentMethod = "" | "efectivo" | "tarjeta" | "transferencia";
export const paymentLabel = (pm: PaymentMethod) =>
  pm === "efectivo"
    ? "Efectivo"
    : pm === "tarjeta"
    ? "Tarjeta"
    : pm === "transferencia"
    ? "Transferencia"
    : "";

/** ==== Utilidades de carrito ==== */
export type CartItemLike = {
  cartKey?: string;
  id: number;
  nombre: string;
  imagen: string;
  cantidad: number;
  precioUnit?: number;
  opcion?: { id: string; label: string };
  codigo?: string;
  valor?: number;
  blurDataUrl?: string;
};

export const priceOf = (item: CartItemLike) =>
  typeof item.precioUnit === "number"
    ? item.precioUnit
    : typeof item.valor === "number"
    ? item.valor
    : 0;

export const keyOf = (item: CartItemLike) =>
  item.cartKey ?? `${item.id}:${item.opcion?.id ?? "base"}`;

export const codePartOf = (item: CartItemLike) =>
  item.codigo ? `${item.codigo} | ` : "";

export const nameWithTipo = (item: CartItemLike) =>
  item.opcion?.label ? `${item.nombre} — ${item.opcion.label}` : item.nombre;

/** La dejamos exportada por compatibilidad (puede usarse para repartir s/ t gratis) */
export function splitFreeEvenly(s: number, t: number, g: number) {
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

/** ==== Checkout state ==== */
export interface CheckoutState {
  name: string;
  lastName: string;
  phone: string;
  deliveryType: "retiro" | "delivery";
  address: string;
  coords: [number, number] | null;

  // Gratis (limitadas por el pool soya/teriyaki del pedido)
  soya: number | "";
  teriyaki: number | "";

  // Extras pagados (se cobran directamente, no usan pool)
  soyaExtra: number | "";
  teriyakiExtra: number | "";

  // Otras salsas pagadas
  acevichada: number | "";
  maracuya: number | "";

  // Complementos
  palitos: number | "";

  // Pool gratis independiente Jengibre/Wasabi (numéricos, p.ej. máx 2 en total entre ambos)
  jengibre: number | "";      // gratis
  wasabi: number | "";        // gratis
  extraJengibre: number | ""; // se cobra
  extraWasabi: number | "";   // se cobra

  observacion: string;
  paymentMethod: PaymentMethod;
}

export type CheckoutAction =
  | { type: "SET_FIELD"; field: keyof CheckoutState; value: unknown };

export const initialCheckoutState: CheckoutState = {
  name: "",
  lastName: "",
  phone: "",
  deliveryType: "retiro",
  address: "",
  coords: null,

  // Pools y extras
  soya: 0,
  teriyaki: 0,
  soyaExtra: 0,
  teriyakiExtra: 0,

  acevichada: 0,
  maracuya: 0,

  palitos: 0,

  // Jengibre/Wasabi como cantidades (no booleans)
  jengibre: 0,
  wasabi: 0,
  extraJengibre: 0,
  extraWasabi: 0,

  observacion: "",
  paymentMethod: "",
};

export function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

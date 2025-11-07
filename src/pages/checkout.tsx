"use client";
import React, { useMemo, useReducer, useEffect, useState, useCallback } from "react";
import { FaBirthdayCake, FaGift } from "react-icons/fa";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useCart } from "@/context/CartContext";
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile, MAX_SAVED_ADDRESSES } from "@/context/UserContext";
import type { AddressRecord, AddressCoords } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { BIRTHDAY_COUPON_CODE, BIRTHDAY_DISCOUNT_PERCENT, getBirthdayWeekBounds, formatBirthdayWeekRange } from "@/utils/birthday";
import type { BirthdayEligibility } from "@/types/birthday";
import type { DiscountCode } from "@/types/coupon";

// THEME
const ACCENT_FROM = "from-emerald-500";
const ACCENT_TO = "to-green-600";

type SavedAddress = AddressRecord;

const coordsToLngLat = (coords?: AddressCoords | null): [number, number] | null => {
  if (!coords) return null;
  const { lng, lat } = coords;
  if (typeof lng === "number" && typeof lat === "number") {
    return [lng, lat];
  }
  return null;
};

const labelLooksLikeNumeroCasa = (value: string): boolean => {
  if (!value) return false;
  return REGEX_NUMERO_CALLE.test(value);
};

const extractNumeroCasa = (addr: SavedAddress): string => {
  if (!addr) return "";
  const coordsNumero = addr.coords && typeof addr.coords === "object" ? addr.coords.numeroCasa ?? null : null;
  if (coordsNumero && String(coordsNumero).trim()) return String(coordsNumero).trim();
  const metaVersion = addr.coords && typeof addr.coords === "object" ? addr.coords.metaVersion ?? null : null;
  const label = addr.label ?? "";
  if (!metaVersion && label && labelLooksLikeNumeroCasa(label)) {
    return label.trim();
  }
  return "";
};

const shortLabelFromSavedAddress = (addr: SavedAddress): string => {
  const base = toShortCLAddress(addr.address_text);
  const numero = extractNumeroCasa(addr);
  return numero ? `${base}, N° ${numero}` : base;
};

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
  nameWithTipo,
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
import { REPEAT_ORDER_META_KEY, type RepeatOrderMeta } from "@/utils/repeatOrder";

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

  // Tope de palitos gratis desde catálogo
  const maxPalitosGratis = useMemo(
    () => maxPalitosGratisFromCart(cartTyped, byId as Map<number, ProductoMinPalitos>),
    [cartTyped]
  );

  const [estimateText, setEstimateText] = React.useState<string | null>(null);
  const userProfileCtx = useUserProfile();
  const profile = userProfileCtx?.profile ?? null;
  const [savedAddresses, setSavedAddresses] = React.useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<number | null>(null);
  const [deletingAddressIds, setDeletingAddressIds] = React.useState<number[]>([]);
  const [addingNewAddress, setAddingNewAddress] = React.useState(false);
  const [newAddressCandidate, setNewAddressCandidate] = React.useState<{ address: string; coords: [number, number] } | null>(null);
  const [addressLabelInput, setAddressLabelInput] = React.useState("");
  const [saveAddressError, setSaveAddressError] = React.useState<string | null>(null);
  // Map of cartKey -> included (true means included in order)
  const addressLimitReached = savedAddresses.length >= MAX_SAVED_ADDRESSES;
  const [repeatMeta, setRepeatMeta] = React.useState<RepeatOrderMeta | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const rawMeta = sessionStorage.getItem(REPEAT_ORDER_META_KEY);
    if (!rawMeta) return;
    sessionStorage.removeItem(REPEAT_ORDER_META_KEY);
    try {
      const meta = JSON.parse(rawMeta) as RepeatOrderMeta;
      setRepeatMeta(meta);
      const normalizedDelivery =
        meta?.deliveryType === "delivery"
          ? "delivery"
          : meta?.deliveryType === "retiro"
          ? "retiro"
          : null;
      if (normalizedDelivery) {
        dispatch({ type: "SET_FIELD", field: "deliveryType", value: normalizedDelivery });
        if (normalizedDelivery === "delivery") {
          setAddingNewAddress(false);
        }
      }
      if (typeof meta?.address === "string" && meta.address.trim()) {
        let addressValue = meta.address.trim();
        let numeroCasaFromAddress = "";
        const numeroMatch = addressValue.match(/(?:^|,\s*)(?:N°|No\.?|#)\s*([A-Za-z0-9-]+)/i);
        if (numeroMatch) {
          numeroCasaFromAddress = numeroMatch[1].trim();
          addressValue = addressValue.replace(/(?:,\s*)?(?:N°|No\.?|#)\s*[A-Za-z0-9-]+\s*$/i, "").trim();
        }
        dispatch({ type: "SET_FIELD", field: "address", value: addressValue || meta.address });
        if (numeroCasaFromAddress) {
          dispatch({ type: "SET_FIELD", field: "numeroCasa", value: numeroCasaFromAddress });
        }
        setSelectedAddressId(null);
        setAddressLabelInput("");
        setSaveAddressError(null);
        setNewAddressCandidate(null);
      }
    } catch (err) {
      console.warn("No se pudo aplicar la metadata del pedido repetido", err);
    }
  }, [dispatch, setSelectedAddressId, setAddressLabelInput, setSaveAddressError, setNewAddressCandidate, setAddingNewAddress, repeatMeta]);

  React.useEffect(() => {
    if (!repeatMeta || !repeatMeta.address) return;
    if (!savedAddresses.length) return;
    const desired = repeatMeta.address.trim();
    if (!desired) return;
    const normalizedDesired = desired.replace(/\s+/g, " ").trim().toLowerCase();

    const matched = savedAddresses.find((addr) => {
      const shortFull = shortLabelFromSavedAddress(addr);
      const normalizedShort = shortFull.replace(/\s+/g, " ").trim().toLowerCase();
      if (normalizedShort === normalizedDesired) return true;
      const baseOnly = toShortCLAddress(addr.address_text).replace(/\s+/g, " ").trim().toLowerCase();
      return baseOnly === normalizedDesired;
    });

    if (!matched) return;

    const coordsPair = coordsToLngLat(matched.coords);
    const numero = extractNumeroCasa(matched);

    dispatch({ type: "SET_FIELD", field: "address", value: matched.address_text });
    dispatch({ type: "SET_FIELD", field: "coords", value: coordsPair });
    dispatch({ type: "SET_FIELD", field: "numeroCasa", value: numero });
    setSelectedAddressId(matched.id);
    setAddingNewAddress(false);
    setAddressLabelInput("");
    setSaveAddressError(null);
    setNewAddressCandidate(null);
    setRepeatMeta(null);
  }, [repeatMeta, savedAddresses, dispatch]);

  React.useEffect(() => {
    if (addressLimitReached && addingNewAddress) {
      setAddingNewAddress(false);
      setNewAddressCandidate(null);
      setAddressLabelInput("");
    }
  }, [addressLimitReached, addingNewAddress]);

  React.useEffect(() => {
    if (!addressLimitReached) {
      setSaveAddressError(null);
    }
  }, [addressLimitReached]);
  const [includedMap, setIncludedMap] = React.useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const it of cartTyped) m[`${it.id}:${it.opcion?.id ?? 'base'}`] = true;
    return m;
  });

  // Keep includedMap in sync when cart changes: add new keys defaulting to true, remove absent keys
  useEffect(() => {
    setIncludedMap((prev) => {
      const next: Record<string, boolean> = {};
      for (const it of cartTyped) {
        const k = `${it.id}:${it.opcion?.id ?? 'base'}`;
        next[k] = k in prev ? prev[k] : true;
      }
      return next;
    });
  }, [cartTyped]);

  // Items that are included in the order according to includedMap
  const includedCart = useMemo(() => {
    return cartTyped.filter((it) => includedMap[`${it.id}:${it.opcion?.id ?? 'base'}`] !== false);
  }, [cartTyped, includedMap]);

  // Fetch estimate when deliveryType or on mount
  useEffect(() => {
    let mounted = true;
    const t = deliveryType === 'delivery' ? 'delivery' : 'retiro';
    fetch(`/api/estimate?type=${t}`)
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        if (d?.ok) setEstimateText(d.estimatedText ?? d.estimatedMax ?? null);
      })
      .catch(() => {
        if (mounted) setEstimateText(null);
      });
    return () => { mounted = false; };
  }, [deliveryType]);

  // Fetch saved addresses for logged-in user
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    fetch('/api/user/addresses')
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        const fetched = ((d?.addresses ?? []) as SavedAddress[]).slice(0, MAX_SAVED_ADDRESSES);
        setSavedAddresses(fetched);
        if (fetched.length > 0) setSelectedAddressId(fetched[0].id);
        setAddressLabelInput("");
        setSaveAddressError(null);
      })
      .catch(() => {
        if (mounted) setSavedAddresses([]);
      });
    return () => { mounted = false; };
  }, [user]);

  // Cálculos monetarios/totales
  const {
    totalProductos,
    costoPalitosExtra,
    costoAyudaPalitos,
    deliveryFee,
    totalFinal,
    gratisBasicas,
  } = useMemo(() => {
    const prod = includedCart.reduce((acc, it) => acc + priceOf(it) * it.cantidad, 0);

    // Pool de salsas gratis según catálogo (based on included items)
    const gratis = includedCart.reduce(
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
    const total = prod + costoSoya + costoTeri + cPalitosExtra + cAyudaPalitos + fee;

    return {
      totalProductos: prod,
      costoPalitosExtra: cPalitosExtra,
      costoAyudaPalitos: cAyudaPalitos,
      deliveryFee: fee,
      totalFinal: total,
      gratisBasicas: gratis,
    };
  }, [
    includedCart,
    soya,
    teriyaki,
    palitosExtra,
    ayudaPalitos,
    deliveryType,
  ]);

  const requiresPayment = deliveryType === "delivery";

  // La validación de salsas se hará en el componente ExtrasSelector con los checkboxes

  const canSubmitBase =
    // require authenticated user; name/phone are taken from profile
    !!user && !!profile &&
    (!requiresPayment || paymentMethod !== "") &&
    // Para delivery: requerimos una dirección guardada o coords y número de domicilio
    (deliveryType === "retiro" || (selectedAddressId !== null || (coords && (REGEX_NUMERO_CALLE.test(address) || (numeroCasa && numeroCasa.trim().length > 0))))) &&
    salsasValidas; // ✅ Agregar validación de salsas

  const [submitting, setSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [lastOrderWhatsApp, setLastOrderWhatsApp] = useState<any>(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [birthdayEligibility, setBirthdayEligibility] = useState<BirthdayEligibility | null>(null);
  const [birthdayStatusLoading, setBirthdayStatusLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<DiscountCode[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [skipBirthdayCoupon, setSkipBirthdayCoupon] = useState(false);

  const birthdayCouponEligible = birthdayEligibility?.eligibleNow ?? false;

  const birthdayCouponAppliedCode = (appliedCoupon || "").toUpperCase() === BIRTHDAY_COUPON_CODE;

  const birthdayCouponActive = useMemo(
    () => birthdayCouponEligible && !skipBirthdayCoupon && !appliedCoupon,
    [birthdayCouponEligible, skipBirthdayCoupon, appliedCoupon],
  );

  const birthdayCouponApplied = birthdayCouponActive || birthdayCouponAppliedCode;

  const hasOtherCoupon = Boolean(appliedCoupon && !birthdayCouponAppliedCode);

  const birthdayDiscountPercent = birthdayEligibility?.discountPercent ?? BIRTHDAY_DISCOUNT_PERCENT;

  const birthdayDiscountAmount = useMemo(() => {
    if (!birthdayCouponActive) return 0;
    return Math.max(0, Math.round(totalFinal * birthdayDiscountPercent / 100));
  }, [birthdayCouponActive, totalFinal, birthdayDiscountPercent]);

  const totalAfterDiscount = useMemo(
    () => Math.max(0, totalFinal - birthdayDiscountAmount),
    [totalFinal, birthdayDiscountAmount],
  );

  const birthdayCouponCode = birthdayCouponActive ? BIRTHDAY_COUPON_CODE : null;
  const couponCodeForOrder = appliedCoupon || birthdayCouponCode;

  const birthdayWeekRangeLabel = useMemo(() => {
    if (!birthdayEligibility) return null;
    const bounds = getBirthdayWeekBounds(
      birthdayEligibility.birthday,
      birthdayEligibility.window ?? birthdayEligibility.nextWindow ?? null,
    );
    return bounds ? formatBirthdayWeekRange(bounds) : null;
  }, [birthdayEligibility]);

  const birthdayValidityReminder = birthdayWeekRangeLabel
    ? `${birthdayWeekRangeLabel}.`
    : 'Recuerda usarlo en tu semana de cumpleaños.';

  const birthdayCardTitle = birthdayCouponApplied
    ? "Descuento de cumpleaños activo"
    : skipBirthdayCoupon
    ? "Descuento de cumpleaños guardado"
    : "Descuento de cumpleaños disponible";

  const birthdayCardBody = birthdayCouponApplied
    ? `${birthdayDiscountPercent}% · código ${BIRTHDAY_COUPON_CODE}. Se aplicará automáticamente en este pedido y es válido una sola vez durante tu semana de cumpleaños.`
    : skipBirthdayCoupon
    ? `Lo guardaste para usarlo en otra compra de esta semana. Cuando quieras activarlo, presiona "Usar en este pedido". ${birthdayValidityReminder}`
    : `${birthdayDiscountPercent}% · código ${BIRTHDAY_COUPON_CODE}. Puedes activarlo en esta compra o guardarlo para más tarde durante la semana de tu cumpleaños.`;

  const handleDeferBirthdayCoupon = useCallback(() => {
    setSkipBirthdayCoupon(true);
    if (birthdayCouponAppliedCode) {
      setAppliedCoupon(null);
    }
  }, [birthdayCouponAppliedCode]);

  const handleActivateBirthdayCoupon = useCallback(() => {
    if (hasOtherCoupon || birthdayCouponAppliedCode) {
      setAppliedCoupon(null);
    }
    setSkipBirthdayCoupon(false);
    setCouponModalOpen(false);
  }, [hasOtherCoupon, birthdayCouponAppliedCode]);

  const fetchBirthdayEligibility = useCallback(async () => {
    if (!user) {
      setBirthdayEligibility(null);
      setBirthdayStatusLoading(false);
      return;
    }
    setBirthdayStatusLoading(true);
    try {
      const response = await fetch("/api/coupons/birthday");
      if (!response.ok) {
        setBirthdayEligibility(null);
        return;
      }
      const data = await response.json();
      setBirthdayEligibility((data?.eligibility ?? null) as BirthdayEligibility | null);
    } catch (error) {
      console.error("Error fetching birthday eligibility:", error);
      setBirthdayEligibility(null);
    } finally {
      setBirthdayStatusLoading(false);
    }
  }, [user]);

  const fetchAvailableCoupons = useCallback(async () => {
    if (!user) {
      setAvailableCoupons([]);
      setLoadingCoupons(false);
      return;
    }
    setLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons");
      if (!response.ok) {
        setAvailableCoupons([]);
        return;
      }
      const data = await response.json();
      const rows = Array.isArray(data?.coupons) ? data.coupons as DiscountCode[] : [];
      setAvailableCoupons(rows);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBirthdayEligibility(null);
      setBirthdayStatusLoading(false);
      return;
    }
    fetchBirthdayEligibility();
  }, [user, fetchBirthdayEligibility]);

  useEffect(() => {
    if (!user) {
      setAvailableCoupons([]);
      setLoadingCoupons(false);
      return;
    }
    fetchAvailableCoupons();
  }, [user, fetchAvailableCoupons]);

  useEffect(() => {
    if (!user) {
      setSkipBirthdayCoupon(false);
    }
  }, [user]);

  useEffect(() => {
    if (!birthdayCouponEligible) {
      setSkipBirthdayCoupon(false);
    }
  }, [birthdayCouponEligible]);

  // ⚠️ No permitir enviar si el estado aún está cargando o si ya estamos enviando
  const canSubmit = canSubmitBase && abierto === true && !loadingStatus && !submitting;

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof (e as any).preventDefault === 'function') (e as any).preventDefault();

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

            const includedItems = cartTyped.filter(it => includedMap[`${it.id}:${it.opcion?.id ?? 'base'}`] !== false);

            const productosTexto = includedItems
              .map((item) => {
                const lineaNombre = `${nameWithTipo(item)} x${item.cantidad}`;
                const totalLinea = fmt(priceOf(item) * item.cantidad);
                return ` ${lineaNombre} — ${totalLinea}`;
              })
              .join("\n");

        // ========= Salsas/Palitos =========
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
        if (nJenGratis > 0) lineasSalsas.push(`Jengibre: Sí`);
        if (nWasGratis > 0) lineasSalsas.push(`Wasabi: Sí`);
        
        // Agregar líneas para "sin salsas" si corresponde
        if (nSoya === 0 && nTeri === 0) lineasSalsas.push("Sin salsas Soya/Teriyaki");
        if (nJenGratis === 0 && nWasGratis === 0) lineasSalsas.push("Jengibre: No | Wasabi: No");

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

        const discountInfo = birthdayCouponActive && birthdayDiscountAmount > 0
          ? `${NL}Descuento cumpleaños (${birthdayDiscountPercent}%): -${fmt(birthdayDiscountAmount)}`
          : "";
        const couponInfo = couponCodeForOrder ? `${NL}Cupón aplicado: ${couponCodeForOrder}` : "";
        const msg = `${cuerpoAntesDeTotal.replace(/(\r?\n)+$/, "")}${couponInfo}${discountInfo}${NL}${NL}Total: ${fmt(totalAfterDiscount)}`;

        const mensaje = encodeURIComponent(msg);
        
        // Guardar pedido en BD si el usuario está logueado
        if (user) {
          setSubmitting(true);
          try {
            const orderItems = cartTyped
            .filter(it => includedMap[`${it.id}:${((it as unknown) as { opcion?: { id?: string } }).opcion?.id ?? 'base'}`] !== false)
              .map((it) => {
                const opcion = (it as unknown as { opcion?: unknown }).opcion as unknown;
                return {
                  codigo: codePartOf(it),
                  nombre: it.nombre,
                  valor: priceOf(it),
                  cantidad: it.cantidad,
                  opcion: opcion,
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
                customer: {
                  name: `${name} ${lastName}`,
                  phone,
                },
                // include coupon if user aplicó uno o si aplica el automático de cumpleaños
                ...(couponCodeForOrder ? { coupon_code: couponCodeForOrder } : {}),
                // Agregar extras
                extras: bloqueSalsasPalitos.trim(),
                // Incluir también los valores individuales para formateo personalizado
                extrasDetalle: {
                  soya: nSoya,
                  teriyaki: nTeri,
                  jengibreGratis: nJenGratis,
                  wasabiGratis: nWasGratis,
                  palitosGratis: nPalitosGratis,
                  palitosExtra: nPalitosExtra,
                  ayudaPalitos: nAyudaPalitos,
                },
                // Agregar observaciones
                observaciones: observacion && observacion.trim() ? observacion.trim() : null,
              }),
            });

            const json = await resp.json().catch(() => null);
            if (resp.ok) {
              // show confirmation modal with order id when available
              const oid = json?.order?.id ?? null;
              if (oid) setLastOrderId(oid as number);
              setLastOrderWhatsApp(json?.whatsapp ?? null);
              setShowOrderModal(true);
              fetchBirthdayEligibility();
              fetchAvailableCoupons();
              // Optionally clear cart here if you want: (not doing automatically)
            } else {
              console.error('Error saving order:', json);
              alert('No se pudo guardar el pedido. Intenta de nuevo.');
            }
          } catch (error) {
            console.error("Error saving order:", error);
            alert('No se pudo guardar el pedido. Intenta de nuevo.');
          } finally {
            setSubmitting(false);
          }
        }
      })
      .catch(() => alert("No se pudo verificar el estado del local. Intenta de nuevo."));
  };

  const inputBase =
    "w-full rounded-xl border border-white/10 bg-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const card = "border border-white/10 rounded-2xl bg-neutral-900/70 shadow-xl";

  return (
    <>
    <Seo title="Panel de administración — Masushi" canonicalPath="/admin" noIndex />
      <Navbar />
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
  <div className="w-full px-3 lg:px-30 py-6">
          <div className="mb-6">
            <div className={`mt-2 h-1 w-24 bg-gradient-to-r ${ACCENT_FROM} ${ACCENT_TO} rounded-full`} />
          </div>

          {/* Layout de 2 columnas: left flexible, right fixed width */}
          <div className="grid grid-cols-1 gap-6 lg:[grid-template-columns:1fr_780px]">
            {/* Columna izquierda: Delivery / Tipo / Dirección (sin recuadro exterior) */}
            <div className="p-4 lg:pr-2 lg:pl-0"> 
              {/* Estado de apertura */}
              <div className="rounded-xl bg-neutral-800/70 border border-white/10 p-3 text-sm flex items-center justify-between">
                <span className={abierto ? "text-emerald-300" : "text-amber-300"}>{statusLabel}</span>
                {statusData?.timeZone && <span className="text-neutral-400" />}
              </div>

              {/* Delivery form controls (moved here) */}
              <div className="mt-4">
                <label className="block font-medium mb-2 text-neutral-200">Tipo de entrega</label>
                <div role="tablist" aria-label="Tipo de entrega" className="w-full inline-flex items-center rounded-full bg-neutral-800/70 p-1 shadow-inner">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={deliveryType === 'delivery'}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "deliveryType", value: 'delivery' })}
                    className={`flex-1 text-sm font-medium h-10 flex items-center justify-center rounded-full transition-all duration-150 ${deliveryType === 'delivery' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-300 hover:bg-neutral-700/60'}`}
                  >
                    Despacho
                  </button>
                  <div className="w-2" />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={deliveryType === 'retiro'}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "deliveryType", value: 'retiro' })}
                    className={`flex-1 text-sm font-medium h-10 flex items-center justify-center rounded-full transition-all duration-150 ${deliveryType === 'retiro' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-300 hover:bg-neutral-700/60'}`}
                  >
                    Retiro
                  </button>
                </div>
              </div>

              {deliveryType === "delivery" && (
                <>
                  <div className="mt-4">
                    <PaymentSelector paymentMethod={paymentMethod} dispatch={dispatch} />
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium mb-2 text-neutral-200">Direcciones</label>
                    {savedAddresses.length > 0 && (
                      <div className="mb-3">
                        {savedAddresses.map((a) => {
                          const alias = (a.label ?? "").trim();
                          const numeroGuardado = extractNumeroCasa(a);
                          const coordsPair = coordsToLngLat(a.coords);
                          const isSelected = selectedAddressId === a.id;
                          return (
                            <div key={a.id} className={`block p-3 rounded-md border ${isSelected ? 'border-green-400 bg-neutral-800/60' : 'border-white/5'} mb-2`}>
                              <div className="flex items-start justify-between">
                                <label
                                  className="flex-1 cursor-pointer"
                                  onClick={() => {
                                    setSelectedAddressId(a.id);
                                    setAddingNewAddress(false);
                                    dispatch({ type: "SET_FIELD", field: "address", value: a.address_text });
                                    dispatch({ type: "SET_FIELD", field: "coords", value: coordsPair });
                                    dispatch({ type: "SET_FIELD", field: "numeroCasa", value: numeroGuardado });
                                    setAddressLabelInput("");
                                    setSaveAddressError(null);
                                    setNewAddressCandidate(null);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <input type="radio" name="savedAddress" checked={isSelected} readOnly className="mr-2" />
                                    <span className="font-medium">{alias || 'Dirección guardada'}</span>
                                  </div>
                                  <div className="text-sm text-neutral-400">
                                    {a.address_text}
                                    {numeroGuardado ? ` - ${numeroGuardado}` : ""}
                                  </div>
                                </label>
                                <div className="ml-3 flex-shrink-0">
                                  <button
                                    type="button"
                                    aria-label={`Eliminar dirección ${a.address_text}`}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setDeletingAddressIds(prev => [...prev, a.id]);
                                      try {
                                        const ok = await userProfileCtx?.deleteAddress(a.id);
                                        if (ok) {
                                          setSavedAddresses(prev => prev.filter(x => x.id !== a.id));
                                          if (selectedAddressId === a.id) {
                                            setSelectedAddressId(null);
                                            dispatch({ type: "SET_FIELD", field: "address", value: "" });
                                            dispatch({ type: "SET_FIELD", field: "coords", value: null });
                                            dispatch({ type: "SET_FIELD", field: "numeroCasa", value: "" });
                                          }
                                          setSaveAddressError(null);
                                        }
                                      } finally {
                                        setDeletingAddressIds(prev => prev.filter(id => id !== a.id));
                                      }
                                    }}
                                    className="p-1 rounded-md text-neutral-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    disabled={deletingAddressIds.includes(a.id)}
                                  >
                                    {deletingAddressIds.includes(a.id) ? (
                                      <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                                    ) : (
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/></svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mb-3 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (addressLimitReached && !addingNewAddress) return;
                          setAddingNewAddress((v) => !v);
                          if (!addingNewAddress) {
                            setSelectedAddressId(null);
                            setAddressLabelInput("");
                            setSaveAddressError(null);
                          }
                        }}
                        className={`text-sm underline ${addressLimitReached && !addingNewAddress ? 'cursor-not-allowed text-neutral-500' : ''}`}
                        disabled={addressLimitReached && !addingNewAddress}
                      >
                        {addingNewAddress ? 'Cancelar' : 'Agregar nueva dirección'}
                      </button>
                      {addressLimitReached && !addingNewAddress && (
                        <span className="text-xs text-neutral-400">
                          Alcanzaste el máximo de {MAX_SAVED_ADDRESSES} direcciones guardadas. Elimina una para agregar otra.
                        </span>
                      )}
                    </div>

                    {addingNewAddress && (
                      <div className="mb-3">
                        <AddressSearch polygonCoords={polygonCoords} displayFullAddress={true} onValidAddress={(addr, crds) => {
                          // Populate the form but don't auto-save. User must confirm save.
                          dispatch({ type: "SET_FIELD", field: "address", value: addr });
                          dispatch({ type: "SET_FIELD", field: "coords", value: crds });
                          setNewAddressCandidate({ address: addr, coords: crds });
                          setSaveAddressError(null);
                        }} />

                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              id="aliasDireccion"
                              type="text"
                              className={`${inputBase} sm:w-56`}
                              placeholder="Nombre (ej. Casa mama)"
                              value={addressLabelInput}
                              onChange={(e) => {
                                setAddressLabelInput(e.target.value);
                                setSaveAddressError(null);
                              }}
                              maxLength={64}
                            />
                            <input
                              id="numeroCasa_in_block"
                              type="text"
                              className={`${inputBase} sm:w-44`}
                              placeholder="N° casa / Depto (opcional)"
                              value={numeroCasa || ""}
                              onChange={(e) => {
                                setSaveAddressError(null);
                                dispatch({ type: "SET_FIELD", field: "numeroCasa", value: e.target.value });
                              }}
                            />
                          </div>
                          {saveAddressError && (
                            <div className="text-xs text-red-400">{saveAddressError}</div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!newAddressCandidate || addressLimitReached}
                              onClick={async () => {
                                if (!newAddressCandidate || addressLimitReached) {
                                  setSaveAddressError(`Alcanzaste el máximo de ${MAX_SAVED_ADDRESSES} direcciones guardadas.`);
                                  return;
                                }
                                try {
                                  const lat = newAddressCandidate.coords[1];
                                  const lng = newAddressCandidate.coords[0];
                                  const saved = await userProfileCtx?.addAddress({
                                    address: newAddressCandidate.address,
                                    coords: { lat, lng },
                                    label: addressLabelInput.trim() ? addressLabelInput.trim() : null,
                                    numeroCasa: numeroCasa ?? null,
                                  });
                                  if (saved) {
                                    setSavedAddresses(prev => [saved, ...prev].slice(0, MAX_SAVED_ADDRESSES));
                                    setSelectedAddressId(saved.id);
                                    setAddingNewAddress(false);
                                    setNewAddressCandidate(null);
                                    setAddressLabelInput("");
                                    setSaveAddressError(null);
                                  } else {
                                    setSaveAddressError(`No se pudo guardar la dirección. Verifica que no hayas alcanzado el máximo de ${MAX_SAVED_ADDRESSES} direcciones.`);
                                  }
                                } catch (e) {
                                  console.error('Error saving address', e);
                                  setSaveAddressError('No se pudo guardar la dirección. Intenta nuevamente.');
                                }
                              }}
                              className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500 disabled:opacity-50"
                            >Guardar dirección</button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewAddressCandidate(null);
                                setAddressLabelInput("");
                                setSaveAddressError(null);
                                setSelectedAddressId(null);
                                dispatch({ type: "SET_FIELD", field: "address", value: "" });
                                dispatch({ type: "SET_FIELD", field: "coords", value: null });
                                dispatch({ type: "SET_FIELD", field: "numeroCasa", value: "" });
                              }}
                              className="text-sm underline"
                            >Limpiar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-6 space-y-4">
                {birthdayStatusLoading ? (
                  <p className="text-xs text-neutral-400">Verificando descuento de cumpleaños…</p>
                ) : birthdayCouponEligible ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-green-400/40 bg-green-500/10 p-4 text-xs text-green-100 shadow-[0_8px_20px_rgba(16,185,129,0.25)]">
                    <div className="flex items-start gap-3">
                      <FaBirthdayCake className="mt-0.5 text-base" aria-hidden="true" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-200">{birthdayCardTitle}</p>
                        <p className="mt-1 leading-relaxed">{birthdayCardBody}</p>
                        {hasOtherCoupon ? (
                          <p className="mt-2 text-xs text-green-200">
                            Usaremos este descuento y quitaremos el cupón {appliedCoupon} cuando lo actives.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-green-100">
                      <button
                        type="button"
                        onClick={birthdayCouponApplied ? handleDeferBirthdayCoupon : handleActivateBirthdayCoupon}
                        className={`rounded-full px-5 py-2 font-semibold transition-all duration-150 ${
                          birthdayCouponApplied
                            ? "bg-green-700/40 text-green-200 hover:bg-green-700/60"
                            : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/40"
                        }`}
                      >
                        {birthdayCouponApplied ? "Guardar para otro pedido" : "Usar en este pedido"}
                      </button>
                      {skipBirthdayCoupon ? (
                        <span className="text-xs text-green-200">{birthdayValidityReminder}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {loadingCoupons ? (
                <p className="mt-3 text-xs text-neutral-400">Buscando cupones disponibles…</p>
              ) : availableCoupons.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {availableCoupons.map((coupon) => {
                    const percent = typeof coupon.percent === "number" ? coupon.percent : null;
                    const amount = typeof coupon.amount === "number" ? coupon.amount : null;
                    const codeUpper = (coupon.code || "").trim().toUpperCase();
                    const benefitLabel = percent
                      ? `Descuento ${percent}%`
                      : amount
                      ? `Descuento ${fmt(amount)}`
                      : "Cupón disponible";
                    const expiresLabel = coupon.expires_at
                      ? new Date(coupon.expires_at).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : null;
                    const isApplied = (appliedCoupon || "").toUpperCase() === codeUpper;
                    return (
                      <div
                        key={coupon.id}
                        className="overflow-hidden rounded-2xl border border-green-400/40 bg-gradient-to-br from-green-500/15 via-green-500/5 to-green-500/20 p-4 text-sm text-green-50 shadow-[0_10px_25px_rgba(16,185,129,0.25)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-1 items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/30 text-2xl">
                              <FaGift aria-hidden="true" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold tracking-wide text-white">{codeUpper}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-green-200">{benefitLabel}</p>
                              <div className="mt-2 space-y-1 text-xs text-green-100">
                                {coupon.single_use ? <p>Uso único</p> : null}
                                {expiresLabel ? <p>Vence {expiresLabel}</p> : null}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const normalized = codeUpper;
                              setAppliedCoupon(normalized);
                              setCouponInput(normalized);
                              setCouponModalOpen(false);
                            }}
                            disabled={isApplied}
                            className={`min-w-[120px] rounded-full px-5 py-2 text-xs font-semibold transition-all duration-150 ${
                              isApplied
                                ? "bg-green-700/40 text-green-200 cursor-default"
                                : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/40"
                            }`}
                          >
                            {isApplied ? "Aplicado" : "Aplicar cupón"}
                          </button>
                        </div>
                        {coupon.description ? (
                          <p className="mt-3 rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-100">
                            {coupon.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {couponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full text-neutral-900">
                    <h3 className="text-lg font-bold mb-2">Ingresa tu cupón</h3>
                    <p className="text-sm text-neutral-600 mb-4">Introduce el código de descuento vinculado a tu cuenta.</p>
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Código del cupón"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCouponModalOpen(false); setCouponInput(''); }} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
                      <button
                        onClick={() => {
                          const code = (couponInput || '').trim();
                          if (!code) return alert('Ingresa un código válido');
                          setAppliedCoupon(code.toUpperCase());
                          setCouponModalOpen(false);
                        }}
                        className="px-4 py-2 rounded bg-green-600 text-white"
                      >Aplicar</button>
                    </div>
                  </div>
                </div>
              )}

              {appliedCoupon && (
                <div className="mt-2 text-sm text-green-300">
                  Cupón aplicado: <span className="font-medium text-white">{appliedCoupon}</span>
                  <button onClick={() => setAppliedCoupon(null)} className="ml-3 text-xs underline">Quitar</button>
                </div>
              )}
            </div>

            {/* Columna derecha: Detalles del pedido (productos, salsas, carrito) */}
             <div className="relative lg:ml-auto min-w-0 lg:w-[780px]">
              {/* Use min-h so inner elements can size, add overflow-hidden and bottom padding to avoid footer overlap on small screens */}
              <div className={`${card} p-4 sticky top-20 min-h-[calc(100vh-9rem)] flex flex-col w-full overflow-hidden pb-28 sm:pb-0`}> 
                <h2 className="text-xl font-bold mb-5 text-neutral-50">Detalles de tu compra</h2>
                <div className="flex-1 pr-2 h-full">
                  {cartTyped.length > 0 && (
                    <SummaryPanel
                      cart={cartTyped}
                      state={state}
                      dispatch={dispatch}
                      subtotalProductos={totalProductos}
                      deliveryType={deliveryType}
                      deliveryFee={deliveryFee}
                      maxGratisBasicas={gratisBasicas}
                      maxPalitosGratis={maxPalitosGratis}
                      onValidationChange={setSalsasValidas} // 👈 callback de validación
                      includedMap={includedMap}
                      onToggleInclude={(cartKey, included) => setIncludedMap((prev) => ({ ...prev, [cartKey]: included }))}
                    />
                  )}
                </div>
                {/* Footer dentro del contenedor derecho (parte inferior del card) */}
                <div className="mt-4 p-4 border-t border-white/5 bg-neutral-900 rounded-b-2xl md:relative md:shadow-none md:mx-0 md:max-w-none sm:fixed sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] lg:left-1/2 lg:-translate-x-1/2 lg:w-[750px] sm:z-50 sm:rounded-2xl sm:shadow-lg md:rounded-b-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-neutral-400">Subtotal</div>
                    <div className="text-sm font-semibold">{fmt(totalProductos)}</div>
                  </div>
                    {couponCodeForOrder && (
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-neutral-400">Cupón</div>
                        <div className="text-sm font-semibold text-green-300">{couponCodeForOrder}</div>
                      </div>
                    )}
                    {birthdayDiscountAmount > 0 && (
                      <div className="flex items-center justify-between mb-2 text-sm text-green-300">
                        <div>Descuento cumpleaños ({birthdayDiscountPercent}%)</div>
                        <div>-{fmt(birthdayDiscountAmount)}</div>
                      </div>
                    )}
                  {deliveryFee > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-neutral-400">Delivery</div>
                      <div className="text-sm">{fmt(deliveryFee)}</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg text-white font-bold">Total</div>
                      <div className="text-lg text-white font-bold">{fmt(totalAfterDiscount)}</div>
                  </div>
                  <div className="mb-3 text-sm text-red-400">{estimateText ? `Hora estimada: ${estimateText}` : null}</div>
                  <div>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`w-full rounded-full px-6 py-3 font-medium text-white bg-red-700 hover:bg-red-600 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {abierto === false
                        ? statusData?.nextOpen
                          ? `Cerrado • abrimos ${statusData.nextOpen.human}`
                          : "Cerrado"
                        : loadingStatus
                        ? "Comprobando horario…"
                        : `Hacer pedido`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-lg p-6 max-w-md w-full shadow-2xl border border-neutral-800">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 mb-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">¡Pedido Recibido! 🍣</h3>
              {lastOrderId && (
                <p className="text-sm text-neutral-400 mb-3">Orden #{lastOrderId}</p>
              )}
            </div>
            
            <div className="bg-green-950/50 border border-green-900/50 rounded-lg p-4 mb-4">
              <p className="text-neutral-200 text-center">
                <span className="font-semibold text-white">Te llegará un mensaje automático de WhatsApp</span><br />
                con toda la información de tu pedido y el tiempo estimado de entrega.
              </p>
            </div>

            <div className="text-center text-sm text-neutral-400 mb-4">
              Gracias por preferirnos 🥢
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => setShowOrderModal(false)} 
                className="px-6 py-3 rounded-full font-medium text-white bg-red-700 hover:bg-red-600 shadow-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

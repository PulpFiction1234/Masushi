import { useState, useEffect, useMemo, useCallback } from "react";
import type { IconType } from "react-icons";
import {
  FaBirthdayCake,
  FaCalendarCheck,
  FaStore,
  FaIdBadge,
  FaShoppingBag,
  FaTruck,
} from "react-icons/fa";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import Seo from "@/components/Seo";
import type { Order } from "@/types/user";
import { fmtMiles } from "@/utils/format";
import type { Producto } from "@/data/productos";
import { getProductByCode, getProductName, getProductPrice, resolveProductImageUrl } from "@/utils/productLookup";
import { useCart, type CartOpcion } from "@/context/CartContext";
import { REPEAT_ORDER_META_KEY, type RepeatOrderMeta } from "@/utils/repeatOrder";
import {
  BIRTHDAY_DISCOUNT_PERCENT,
  BIRTHDAY_WEEK_LENGTH_DAYS,
  BIRTHDAY_MIN_MONTHS,
  BIRTHDAY_MIN_ORDERS,
  getBirthdayWeekBounds,
  formatBirthdayWeekRange,
} from "@/utils/birthday";
import type { BirthdayEligibility } from "@/types/birthday";

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="%23222"/><text x="50%" y="50%" font-size="14" fill="%23fff" text-anchor="middle" alignment-baseline="central">Sin imagen</text></svg>';

const normalizeOptionId = (value?: string | null) =>
  (value ?? "base")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const buildCartKey = (productId: number, optionId?: string | null) =>
  `${productId}:${normalizeOptionId(optionId)}`;

const sanitizeOrderCode = (codigo: string) => codigo.replace(/\s*\|\s*$/, "").trim();

const fallbackProductId = (codigo: string, nombre: string) => {
  const digits = codigo.replace(/\D/g, "");
  if (digits) {
    const asNumber = Number.parseInt(digits, 10);
    if (!Number.isNaN(asNumber) && asNumber > 0) return asNumber;
  }
  let hash = 0;
  const base = (nombre || codigo || "legacy").trim();
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return 100_000 + (hash % 900_000);
};

type ExtendedOrderItem = Order["items"][number] & { nombre?: string; valor?: number };

type DeliveryTypeLike = Order["delivery_type"] | number | string | null | undefined;

const resolveDeliveryTypeValue = (value: DeliveryTypeLike): "delivery" | "retiro" | null => {
  if (value === "delivery" || value === "retiro") return value;
  if (typeof value === "number") {
    if (value === 1) return "delivery";
    if (value === 0) return "retiro";
    return null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "delivery" || normalized === "retiro") return normalized;
    const numeric = Number.parseInt(normalized, 10);
    if (!Number.isNaN(numeric)) {
      if (numeric === 1) return "delivery";
      if (numeric === 0) return "retiro";
    }
    return null;
  }
  return null;
};

type RepeatItemResolution =
  | {
      type: "ok";
      product: Producto;
      cantidad: number;
      opcion?: CartOpcion;
      precioUnit: number;
      label: string;
    }
  | { type: "skip"; reason: string };

const resolveOrderItemForRepeat = (item: ExtendedOrderItem): RepeatItemResolution => {
  const rawCode = typeof item.codigo === "string" ? item.codigo : "";
  const sanitizedCode = sanitizeOrderCode(rawCode);
  const productMatch = sanitizedCode ? getProductByCode(sanitizedCode) : rawCode ? getProductByCode(rawCode) : undefined;
  const label = (item as { nombre?: unknown }).nombre && typeof (item as { nombre?: unknown }).nombre === "string"
    ? (item as { nombre: string }).nombre
    : productMatch?.nombre || getProductName(sanitizedCode || rawCode || "");
  const valorRegistro = (item as { valor?: unknown }).valor;
  const precioUnit = typeof valorRegistro === "number" ? valorRegistro : productMatch?.valor || getProductPrice(sanitizedCode || rawCode || "");
  const cantidad = Math.max(1, Number(item.cantidad) || 1);
  const opcion = item.opcion && typeof item.opcion === "object" && typeof (item.opcion as { id?: unknown }).id === "string"
    ? { id: (item.opcion as { id: string }).id, label: (item.opcion as { label?: string }).label || (item.opcion as { id: string }).id }
    : undefined;

  if (productMatch && productMatch.enabled === false) {
    return { type: "skip", reason: `${label} (no disponible)` };
  }

  if (!productMatch && !sanitizedCode && !label) {
    return { type: "skip", reason: "Producto sin referencia" };
  }

  const resolvedProduct: Producto = productMatch
    ? productMatch
    : (() => {
        const fallbackIdValue = fallbackProductId(sanitizedCode, label);
        return {
          id: fallbackIdValue,
          codigo: sanitizedCode || `LEGACY-${fallbackIdValue}`,
          nombre: label || "Producto sin nombre",
          descripcion: "",
          valor: typeof precioUnit === "number" && !Number.isNaN(precioUnit) ? precioUnit : 0,
          imagen: resolveProductImageUrl(sanitizedCode || rawCode) || PLACEHOLDER_IMAGE,
          categoria: "Legacy",
          enabled: true,
        };
      })();

  const precioUnitFinal = typeof precioUnit === "number" && !Number.isNaN(precioUnit) ? precioUnit : resolvedProduct.valor;

  return {
    type: "ok",
    product: resolvedProduct,
    cantidad,
    opcion,
    precioUnit: precioUnitFinal,
    label,
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const { profile, updateProfile, refreshProfile, loading: profileLoading, setBirthday } = useUserProfile();
  const { addToCart, clearCart, updateQuantity, ready } = useCart();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [birthdayStatus, setBirthdayStatus] = useState<BirthdayEligibility | null>(null);
  const [birthdayStatusLoading, setBirthdayStatusLoading] = useState(true);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  const [birthdaySaving, setBirthdaySaving] = useState(false);
  const [birthdayDetailsOpen, setBirthdayDetailsOpen] = useState(false);
  const birthdayWindowLength = BIRTHDAY_WEEK_LENGTH_DAYS;
  const requirementIcons = useMemo<Record<string, IconType>>(
    () => ({
      birthday: FaBirthdayCake,
      accountAge: FaIdBadge,
      orders: FaShoppingBag,
      window: FaCalendarCheck,
    }),
    [],
  );

  const fetchBirthdayStatus = useCallback(async () => {
    if (!user) {
      setBirthdayStatus(null);
      setBirthdayStatusLoading(false);
      return;
    }
    setBirthdayStatusLoading(true);
    try {
      const response = await fetch("/api/coupons/birthday");
      if (!response.ok) {
        setBirthdayStatus(null);
        return;
      }
      const data = await response.json();
      setBirthdayStatus((data?.eligibility ?? null) as BirthdayEligibility | null);
    } catch (err) {
      console.error("Error fetching birthday eligibility:", err);
      setBirthdayStatus(null);
    } finally {
      setBirthdayStatusLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait until profile/auth initialization finishes before redirecting.
    // `useUser` may be briefly null on reload while the client restores session.
    if (profileLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    }
  }, [user, profile, router, profileLoading]);

  useEffect(() => {
    fetchBirthdayStatus();
  }, [fetchBirthdayStatus]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders || []);
          const total = Number(data?.totalOrders);
          setTotalOrders(Number.isFinite(total) ? total : (Array.isArray(data?.orders) ? data.orders.length : 0));
          await fetchBirthdayStatus();
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, fetchBirthdayStatus]);

  const formattedBirthday = useMemo(() => {
    if (!profile?.birthday) return null;
    // Parse YYYY-MM-DD sin conversión de zona horaria
    const match = profile.birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match;
    // Crear fecha en zona horaria local para evitar desfase
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "long" });
  }, [profile?.birthday]);

  const birthdayMaxDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const birthdayWindowText = useMemo(() => {
    if (!birthdayStatus) return null;
    const bounds = getBirthdayWeekBounds(
      birthdayStatus.birthday,
      birthdayStatus.window ?? birthdayStatus.nextWindow ?? null,
    );
    return bounds ? formatBirthdayWeekRange(bounds) : null;
  }, [birthdayStatus]);

  const birthdayRequirements = useMemo(
    () => [
      {
        key: "birthday",
        label: "Cumpleaños registrado",
        met: Boolean(profile?.birthday),
      },
      {
        key: "accountAge",
        label: `Al menos ${BIRTHDAY_MIN_MONTHS} meses con nosotros`,
        met: birthdayStatus?.requirements?.hasMinAccountAge ?? false,
        helper: birthdayStatusLoading
          ? "Cargando..."
          : birthdayStatus
          ? `${birthdayStatus.accountAgeMonths} meses`
          : null,
      },
      {
        key: "orders",
        label: `${BIRTHDAY_MIN_ORDERS} pedidos completados`,
        met: birthdayStatus?.requirements?.hasMinOrders ?? false,
        helper: birthdayStatusLoading
          ? "Cargando..."
          : birthdayStatus
          ? `${birthdayStatus.orderCount} pedidos`
          : `${totalOrders} pedidos`,
      },
      {
        key: "window",
        label: "Estamos en la semana de tu cumpleaños",
        met: birthdayStatus?.withinWindow ?? false,
        helper: birthdayWindowText,
      },
    ],
    [birthdayStatus, profile?.birthday, totalOrders, birthdayWindowText, birthdayStatusLoading],
  );

  const birthdayEligibleNow = birthdayStatus?.eligibleNow ?? false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage("Por favor completa todos los campos.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      setEditing(false);
      await refreshProfile();
    } catch {
      setErrorMessage("Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleBirthdaySubmit = async (e?: React.FormEvent) => {
    if (e && typeof (e as { preventDefault?: () => void }).preventDefault === "function") {
      (e as { preventDefault: () => void }).preventDefault();
    }
    setBirthdayError("");

    const trimmed = birthdayInput.trim();
    if (!trimmed) {
      setBirthdayError("Selecciona una fecha válida.");
      return;
    }

    // Validar formato YYYY-MM-DD
    const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
      setBirthdayError("La fecha seleccionada no es válida.");
      return;
    }

    // Crear fecha en zona horaria local para validación
    const [, yearStr, monthStr, dayStr] = dateMatch;
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const day = parseInt(dayStr);
    const selected = new Date(year, month, day);
    
    if (Number.isNaN(selected.getTime())) {
      setBirthdayError("La fecha seleccionada no es válida.");
      return;
    }

    const today = new Date();
    if (selected > today) {
      setBirthdayError("La fecha de nacimiento no puede ser en el futuro.");
      return;
    }

    setBirthdaySaving(true);
    try {
      const result = await setBirthday(trimmed);
      if (!result.success) {
        setBirthdayError(result.error || "No se pudo guardar la fecha de cumpleaños.");
        return;
      }
      setShowBirthdayModal(false);
      setBirthdayInput("");
      await fetchBirthdayStatus();
    } catch (error) {
      console.error("Unexpected error saving birthday:", error);
      setBirthdayError("Ocurrió un error al guardar la fecha de cumpleaños.");
    } finally {
      setBirthdaySaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error cerrando sesión");
      return;
    }
    router.push("/");
  };

  const repeatOrder = async (order: Order) => {
    if (!ready) {
      alert("El carrito se está inicializando. Intenta nuevamente en unos segundos.");
      return;
    }

    const resolutions = order.items.map((item) => resolveOrderItemForRepeat(item as ExtendedOrderItem));
    const addable = resolutions.filter((entry): entry is Extract<RepeatItemResolution, { type: "ok" }> => entry.type === "ok");

    if (addable.length === 0) {
      alert("No pudimos repetir este pedido porque ninguno de los productos está disponible.");
      return;
    }

    clearCart();

    addable.forEach(({ product, cantidad, opcion, precioUnit }) => {
      addToCart(product, { opcion, precioUnit });
      if (cantidad > 1) {
        const cartKey = buildCartKey(product.id, opcion?.id);
        updateQuantity(cartKey, cantidad);
      }
    });

    const skipped = resolutions
      .filter((entry): entry is Extract<RepeatItemResolution, { type: "skip" }> => entry.type === "skip")
      .map((entry) => entry.reason);

    if (typeof window !== "undefined") {
      const deliveryTypeNormalized = resolveDeliveryTypeValue(order.delivery_type);

      const meta: RepeatOrderMeta = {
        orderId: order.id,
        deliveryType: deliveryTypeNormalized,
        address: order.address ?? null,
        createdAt: Date.now(),
      };

      try {
        sessionStorage.setItem(REPEAT_ORDER_META_KEY, JSON.stringify(meta));
      } catch (err) {
        console.warn("No se pudo guardar la metadata del pedido repetido", err);
      }
    }

    if (skipped.length) {
      alert(`Los siguientes productos no se pudieron agregar: ${skipped.join(", ")}`);
    }

    await router.push(`/checkout?repeat=${order.id}`);
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Seo title="Mi Perfil — Masushi" canonicalPath="/profile" noIndex />
      <Navbar />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-6">
          {/* Encabezado */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold text-sm"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Información del perfil */}
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm">{errorMessage}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 transition-colors font-semibold disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.full_name);
                    setPhone(profile.phone);
                    setErrorMessage("");
                  }}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Nombre</p>
                <p className="text-lg">{profile.full_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Teléfono</p>
                <p className="text-lg">{profile.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors font-semibold"
              >
                Editar perfil
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-5 mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={() => setBirthdayDetailsOpen((open) => !open)}
              className="flex w-full flex-1 items-start justify-between gap-3 rounded-lg border border-white/10 bg-gray-800/60 px-4 py-3 text-left transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/60"
              aria-expanded={birthdayDetailsOpen}
              aria-controls="birthday-discount-details"
            >
              <div className="flex items-start gap-3">
                <FaBirthdayCake className="mt-1 h-6 w-6 text-green-300" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold">Descuento de cumpleaños</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Registra tu fecha para recibir un {BIRTHDAY_DISCOUNT_PERCENT}% de descuento (válido por una compra) durante {birthdayWindowLength} días en la semana de tu cumpleaños.
                  </p>
                </div>
              </div>
              <svg
                className={`mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${birthdayDetailsOpen ? "-rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.168l3.71-2.938a.75.75 0 0 1 .94 1.17l-4.2 3.325a.75.75 0 0 1-.94 0l-4.2-3.325a.75.75 0 0 1 .02-1.06z" />
              </svg>
            </button>
            {profile.birthday ? (
              <div className="self-start rounded-full bg-green-500/20 px-4 py-1 text-sm text-green-200">
                Cumpleaños: {formattedBirthday ?? profile.birthday}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowBirthdayModal(true);
                  setBirthdayError("");
                  setBirthdayInput("");
                }}
                className="self-start rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
              >
                Registrar cumpleaños
              </button>
            )}
          </div>

          {birthdayDetailsOpen ? (
            <div id="birthday-discount-details" className="space-y-4">
              <div className="space-y-2">
                {birthdayStatusLoading ? (
                  <p className="text-sm text-gray-400">Calculando tu estado…</p>
                ) : (
                  birthdayRequirements.map((req) => {
                    const RequirementIcon = requirementIcons[req.key];
                    return (
                      <div key={req.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-gray-800 px-3 py-2">
                        <div className={`flex items-center gap-3 text-sm ${req.met ? "text-green-200" : "text-gray-400"}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${req.met ? "bg-green-400" : "bg-gray-600"}`} />
                          {RequirementIcon ? (
                            <RequirementIcon
                              className={`h-4 w-4 ${req.met ? "text-green-300" : "text-gray-500"}`}
                              aria-hidden="true"
                            />
                          ) : null}
                          <span>{req.label}</span>
                        </div>
                        {req.helper ? <span className="text-xs text-gray-400">{req.helper}</span> : null}
                      </div>
                    );
                  })
                )}
              </div>

              {profile.birthday ? (
                birthdayStatusLoading ? (
                  <div className="rounded-lg border border-white/10 bg-gray-800 p-4 text-sm text-gray-300">
                    Verificando tu estado de descuento de cumpleaños…
                  </div>
                ) : birthdayStatus ? (
                  birthdayEligibleNow ? (
                    <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-100">
                      ¡Listo! El descuento se aplicará automáticamente en tu primera compra de esta semana de cumpleaños.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-gray-800 p-4 text-sm text-gray-300">
                      El descuento se activará automáticamente cuando cumplas todos los requisitos y aplicará a tu primera compra de la semana de cumpleaños. Puedes revisarlo aquí cuando quieras.
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    No pudimos cargar tu estado de descuento en este momento. Intenta recargar la página.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  Solo podrás registrar tu cumpleaños una vez, así que asegúrate de ingresar la fecha correcta.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Últimos pedidos */}
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-4 mt-6">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <FaStore className="h-5 w-5 text-green-300" aria-hidden="true" />
            <span>Mis últimos pedidos</span>
          </h2>

          {loading ? (
            <p className="text-gray-400">Cargando pedidos...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-400">No tienes pedidos registrados aún.</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {(() => {
                        const deliveryType = resolveDeliveryTypeValue(order.delivery_type);
                        const deliveryMeta = (() => {
                          if (deliveryType === "delivery") {
                            return { Icon: FaTruck, text: "Delivery" };
                          }
                          if (deliveryType === "retiro") {
                            return { Icon: FaStore, text: "Retiro" };
                          }
                          return { Icon: null, text: "Tipo de entrega desconocido" };
                        })();
                        const DeliveryIcon = deliveryMeta.Icon;
                        return (
                          <p className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                            {DeliveryIcon ? (
                              <DeliveryIcon className="h-4 w-4 text-gray-300" aria-hidden="true" />
                            ) : null}
                            <span>{deliveryMeta.text}</span>
                            {order.address ? <span className="text-gray-500">· {order.address}</span> : null}
                          </p>
                        );
                      })()}
                    </div>
                    <p className="text-lg font-bold">${fmtMiles.format(order.total)}</p>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => {
                      const displayName = getProductName(item.codigo || "") || `Producto ${item.codigo}`;
                      return (
                        <div key={idx} className="text-sm text-gray-300">
                          {item.cantidad}x {displayName}
                          {item.opcion && ` (${item.opcion.label})`}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => repeatOrder(order)}
                    className="w-full px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition-colors font-semibold text-sm"
                  >
                    Repetir pedido
                  </button>
                </div>
              ))}
            </div>
          )}

          {recentOrders.length > 0 && (
            <button
              onClick={() => router.push("/menu")}
              className="w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors font-semibold"
            >
              Ver menú completo
            </button>
          )}
        </div>
      </main>

      {showBirthdayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="text-lg font-semibold">Registra tu cumpleaños</h2>
            <p className="mt-1 text-sm text-gray-600">
              Esta fecha se usará para activar automáticamente un descuento del {BIRTHDAY_DISCOUNT_PERCENT}% válido por una compra durante la semana de tu cumpleaños.
            </p>
            <form onSubmit={handleBirthdaySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="birthday-input">
                  Fecha de nacimiento
                </label>
                <input
                  id="birthday-input"
                  type="date"
                  value={birthdayInput}
                  onChange={(e) => setBirthdayInput(e.target.value)}
                  max={birthdayMaxDate}
                  required
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
              {birthdayError && <p className="text-sm text-red-500">{birthdayError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!birthdaySaving) {
                      setShowBirthdayModal(false);
                      setBirthdayInput("");
                    }
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={birthdaySaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={birthdaySaving}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
                >
                  {birthdaySaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

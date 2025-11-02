import { useState, useEffect } from "react";
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
  const { profile, updateProfile, refreshProfile, loading: profileLoading } = useUserProfile();
  const { addToCart, clearCart, updateQuantity, ready } = useCart();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    const loadOrders = async () => {
      if (!user) return;

      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

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
    } catch (error) {
      setErrorMessage("Error al actualizar el perfil.");
    } finally {
      setSaving(false);
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

        {/* Últimos pedidos */}
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-4 mt-6">
          <h2 className="text-xl font-bold">Mis últimos pedidos</h2>

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
                        const label =
                          deliveryType === "delivery"
                            ? "🚚 Delivery"
                            : deliveryType === "retiro"
                            ? "🏪 Retiro"
                            : "Tipo de entrega desconocido";
                        return (
                          <p className="text-sm text-gray-400">
                            {label}
                            {order.address && ` - ${order.address}`}
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

      <Footer />
    </div>
  );
}

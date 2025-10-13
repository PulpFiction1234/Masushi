import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import Seo from "@/components/Seo";
import type { Order } from "@/types/user";
import { fmtMiles } from "@/utils/format";
import { useCart } from "@/context/CartContext";

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const { profile, updateProfile, refreshProfile } = useUserProfile();
  const { addToCart } = useCart();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    }
  }, [user, profile, router]);

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

  const repeatOrder = (order: Order) => {
    // Agregar todos los items del pedido al carrito
    order.items.forEach((item) => {
      // Buscar el producto correspondiente (simplificado)
      const producto = {
        id: parseInt(item.codigo) || 0,
        codigo: item.codigo,
        nombre: item.nombre,
        valor: item.valor,
        descripcion: "",
        imagen: "",
        categoria: "",
      };

      addToCart(producto, {
        opcion: item.opcion,
        precioUnit: item.valor,
      });
    });

    // Abrir el carrito
    window.dispatchEvent(new Event("open-cart"));
    alert("Pedido agregado al carrito");
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
                      <p className="text-sm text-gray-400">
                        {order.delivery_type === "delivery" ? "🚚 Delivery" : "🏪 Retiro"}
                        {order.address && ` - ${order.address}`}
                      </p>
                    </div>
                    <p className="text-lg font-bold">${fmtMiles.format(order.total)}</p>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-300">
                        {item.cantidad}x {item.nombre}
                        {item.opcion && ` (${item.opcion.label})`}
                      </div>
                    ))}
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

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Image, { type StaticImageData } from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import Seo from "@/components/Seo";
import type { Order } from "@/types/user";
import { fmtMiles } from "@/utils/format";
import { useCart } from "@/context/CartContext";
import { getProductByCode, getProductName, getProductImage, resolveProductImageUrl } from "@/utils/productLookup";
import { productos as staticProductos } from "@/data/productos";
import { fetchMergedProducts } from "@/utils/mergedProducts";
import { normalizeImageUrl } from "@/utils/imageHelpers";

// Componente de búsqueda de dirección con autocomplete
const AddressSearch = dynamic(() => import("@/components/AddressSearch"), { ssr: false });

// Polígono de zona de reparto (mismo que en checkout)
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

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const { profile, updateProfile, refreshProfile, loading: profileLoading } = useUserProfile();
  const { addToCart } = useCart();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressCoords, setAddressCoords] = useState<[number, number] | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthChecked(true);
      
      if (!session) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [supabase, router]);

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      setAddress(profile.address || "");
    }
  }, [profile]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders || []);
        } else {
          console.error("Error loading orders:", await res.text());
          setRecentOrders([]);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si el perfil ya está cargado
    if (profile) {
      loadOrders();
    }
  }, [user, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage("Por favor completa nombre y teléfono.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ 
        full_name: fullName, 
        phone,
        address: address.trim() || undefined 
      });
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
    await fetchMergedProducts();
    let itemsAgregados = 0;
    for (const item of order.items) {
      const staticProd = getProductByCode(item.codigo);
      if (!staticProd || staticProd.enabled === false) continue;
      addToCart(staticProd as any, {
        opcion: item.opcion,
        precioUnit: staticProd.valor,
      });
      itemsAgregados++;
    }
    if (itemsAgregados > 0) {
      window.dispatchEvent(new Event("open-cart"));
      alert(`${itemsAgregados} producto(s) agregado(s) al carrito`);
    } else {
      alert("No se pudo agregar ningún producto al carrito. Revisa la consola para más detalles.");
    }
  };

  // Mostrar loading mientras verifica autenticación o carga perfil
  if (!authChecked || profileLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {!authChecked ? "Verificando sesión..." : "Cargando perfil..."}
            </p>
          </div>
        </div>
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

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Dirección de delivery (opcional)
                </label>
                <AddressSearch
                  polygonCoords={polygonCoords}
                  initialValue={address}
                  onValidAddress={(validAddress, coords) => {
                    setAddress(validAddress);
                    setAddressCoords(coords);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta dirección se autocompletará en el checkout cuando pidas delivery
                </p>
                {address && (
                  <div className="mt-2 p-2 bg-green-900/20 border border-green-600 rounded text-sm">
                    ✅ Dirección válida: {address}
                  </div>
                )}
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
                    setAddress(profile.address || "");
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
                <p className="text-lg">{user?.email || "No disponible"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Dirección de delivery</p>
                <p className="text-lg">{profile.address || "No configurada"}</p>
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

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, idx) => {
                      // Forzar imagen del catálogo estático correctamente
                      const prod = getProductByCode(item.codigo || "");
                      let productImage: string = '';
                      if (prod?.imagen) {
                        if (typeof prod.imagen === 'object' && prod.imagen && 'src' in prod.imagen) {
                          productImage = prod.imagen.src;
                        } else if (typeof prod.imagen === 'string') {
                          productImage = prod.imagen;
                        }
                      }
                      const productName = prod?.nombre || getProductName(item.codigo);
                      if (!productImage) console.warn('[Profile] No product image for', item.codigo, item);
                      const safeImage = productImage ? normalizeImageUrl(productImage) : '';
                      const placeholderDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23fff' dy='.35em' text-anchor='middle'%3ENo img%3C/text%3E%3C/svg%3E";
                      return (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-700">
                            <Image
                              src={safeImage || placeholderDataUrl}
                              alt={productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-200">
                              {item.cantidad}x {productName}
                            </p>
                            {item.opcion && (
                              <p className="text-xs text-gray-400">
                                {item.opcion.label}
                              </p>
                            )}
                          </div>
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

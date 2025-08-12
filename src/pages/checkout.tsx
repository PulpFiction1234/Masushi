// src/pages/Checkout.tsx
import { useState } from "react";
import AddressSearch from "../components/AddressSearch";
import * as turf from "@turf/turf";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

const polygonCoords = [
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

const PRECIO_SALSA_EXTRA = 300;
const PRECIO_ACEVICHADA = 500;

export default function Checkout() {
  const { cart, total: carritoTotal } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"retiro" | "delivery">("retiro");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);

  const [soya, setSoya] = useState<number | null>(null);
  const [teriyaki, setTeriyaki] = useState<number | null>(null);
  const [acevichada, setAcevichada] = useState<number | null>(null);
  const [palitos, setPalitos] = useState<number | null>(null);

  const [jengibre, setGengibre] = useState(false);
  const [wasabi, setWasabi] = useState(false);
  const [observacion, setObservacion] = useState("");

  const totalProductos = carritoTotal;
  const totalSalsasSeleccionadas = (soya || 0) + (teriyaki || 0);
  const salsasGratis = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const salsasExtraPagas = Math.max(0, totalSalsasSeleccionadas - salsasGratis);
  const totalSalsasExtra = salsasExtraPagas * PRECIO_SALSA_EXTRA;
  const totalAcevichada = (acevichada || 0) * PRECIO_ACEVICHADA;
  const totalFinal = totalProductos + totalSalsasExtra + totalAcevichada;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    if (deliveryType === "delivery") {
      if (!coords) {
        alert("Ingrese una dirección válida.");
        return;
      }

      // Nueva validación: dirección con numeración
      const regexNumeroCalle = /\s\d{1,5}(?:\s|,|$)/;
      if (!regexNumeroCalle.test(address)) {
        alert("Debe ingresar un número de domicilio junto a la calle.");
        return;
      }

      const polygon = turf.polygon([[...polygonCoords, polygonCoords[0]]]);
      const point = turf.point(coords);
      if (!turf.booleanPointInPolygon(point, polygon)) {
        alert("Lo sentimos, tu dirección está fuera de la zona de reparto.");
        return;
      }
    }

    const productosTexto = cart
      .map(
        (item) =>
          ` ${item.codigo} | ${item.nombre} x${item.cantidad} — $${item.valor * item.cantidad}`
      )
      .join("\n");

    const extrasTexto = [
      `Soya: ${soya || 0}`,
      `Teriyaki: ${teriyaki || 0}`,
      `Salsas acevichadas: ${acevichada || 0} = $${totalAcevichada}`,
      `Palitos: ${palitos || 0}`,
      jengibre ? "Gengibre: Sí" : "Gengibre: No",
      wasabi ? "Wasabi: Sí" : "Wasabi: No",
      observacion ? `Observaciones: ${observacion}` : "",
    ].join("\n");

    const mensaje = encodeURIComponent(
      `Tipo: ${deliveryType}\n` +
        (deliveryType === "delivery" ? `Dirección: ${address}\n` : "") +
        `Nombre: ${name}\n` +
        `Teléfono: ${phone}\n` +
        `\n--- Productos ---\n${productosTexto}\n` +
        `\n--- Extras ---\n${extrasTexto}\n` +
        `\nTotal: $${totalFinal}`
    );

    window.open(`https://wa.me/56951869402?text=${mensaje}`, "_blank");
  };

  return (
    <>
      {/* Navbar visible en checkout */}
      <Navbar />

      <div className="flex justify-center p-4 antialiased">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full max-w-lg p-4 rounded-lg shadow space-y-4"
        >
          {cart.length > 0 && (
            <div className="border p-3 rounded bg-gray-50">
              <h3 className="font-bold mb-2 text-gray-900">Tu carrito</h3>
              {cart.map((item) => (
                <div key={item.id} className="mb-1 text-sm text-gray-800">
                  {item.nombre} (x{item.cantidad}) — ${item.valor * item.cantidad}
                </div>
              ))}
              <p className="mt-2 font-bold text-sm text-gray-900">
                Subtotal productos: ${totalProductos}
              </p>

              <p className="text-xs text-gray-700 mt-3 mb-2">
                Incluye 1 salsa por producto. Costo adicional por cada salsa extra: ${PRECIO_SALSA_EXTRA}.
              </p>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-800">Soya</label>
                  <input
                    type="number"
                    min={0}
                    value={soya ?? ""}
                    onChange={(e) => setSoya(e.target.value === "" ? null : Number(e.target.value))}
                    className="border rounded w-16 p-1 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Teriyaki</label>
                  <input
                    type="number"
                    min={0}
                    value={teriyaki ?? ""}
                    onChange={(e) => setTeriyaki(e.target.value === "" ? null : Number(e.target.value))}
                    className="border rounded w-16 p-1 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">
                    Acevichada ($500)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={acevichada ?? ""}
                    onChange={(e) => setAcevichada(e.target.value === "" ? null : Number(e.target.value))}
                    className="border rounded w-16 p-1 text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800">Palitos</label>
                  <input
                    type="number"
                    min={0}
                    value={palitos ?? ""}
                    onChange={(e) => setPalitos(e.target.value === "" ? null : Number(e.target.value))}
                    className="border rounded w-16 p-1 text-center text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-3 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={jengibre}
                    onChange={(e) => setGengibre(e.target.checked)}
                  />
                  Jengibre
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={wasabi}
                    onChange={(e) => setWasabi(e.target.checked)}
                  />
                  Wasabi
                </label>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-800">Observaciones</label>
                <textarea
                  rows={2}
                  className="border rounded w-full p-2 text-sm"
                  placeholder="Ej: sin cebollín, sin nori, etc."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
            </div>
          )}
          <p className="text-lg font-bold text-gray-900">Total final: ${totalFinal}</p>
          <div>
            <label className="block font-semibold mb-1 text-gray-900">Nombre</label>
            <input
              type="text"
              className="border rounded w-full p-2 text-gray-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-900">Teléfono</label>
            <input
              type="tel"
              className="border rounded w-full p-2 text-gray-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-900">Tipo de entrega</label>
            <select
              className="border rounded w-full p-2 text-gray-900"
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value as "retiro" | "delivery")}
            >
              <option value="retiro">Retiro en tienda</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {deliveryType === "delivery" && (
            <div>
              <label className="block font-semibold mb-1 text-gray-900">Dirección</label>
              <div className="w-full">
                <AddressSearch
                  polygonCoords={polygonCoords}
                  onValidAddress={(addr, crds) => {
                    setAddress(addr);
                    setCoords(crds);
                  }}
                />
              </div>
            </div>
          )}
        
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            Hacer pedido
          </button>
        </form>
      </div>
    </>
  );
}

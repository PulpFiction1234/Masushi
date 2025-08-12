import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CarritoPanel from "@/components/CarritoPanel";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { productos, type Producto } from "@/data/productos";
import { useCart } from "@/context/CartContext";
import HeroCarousel from "@/components/HeroCarousel";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart } = useCart(); // ← mover aquí

  return (
    <div className="bg-gray-950 text-white">
      {/* Navbar con el botón que abre el carrito */}
      <Navbar />

      {/* Carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero con carrusel */}
      <HeroCarousel
        // opcional: personaliza las imágenes/intervalo/altura
        // slides={["/images/hero-sushi.jpg","/images/hero-gyoza.jpg","/images/hero-camarones.jpg"]}
        // intervalMs={5000}
        // heightClass="h-[500px] md:h-[600px]"
      />

      {/* Categorías */}
      <section className="py-12 bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Top Rolls</h2>

          {(() => {
            // <-- IDs de los productos destacados (ajusta estos valores)
            const TOP_IDS = [58, 59, 60, 61];

            const topRolls: Producto[] = TOP_IDS
              .map((id) => productos.find((p) => p.id === id))
              .filter((p): p is Producto => Boolean(p));

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {topRolls.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-800 rounded-lg overflow-hidden shadow"
                  >
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm">{p.nombre}</h3>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {p.descripcion}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold">${p.valor}</span>
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Agregar
                        </button>
                      </div>

                      {/* Link opcional para “ver en menú” ese producto */}
                      <a
                        href={`/menu?producto=${p.id}`}
                        className="text-blue-400 text-xs hover:underline mt-2 inline-block"
                      >
                        Ver en menú
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Promociones */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Promociones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((promo) => (
              <div
                key={promo}
                className="border border-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition bg-gray-900"
              >
                <img
                  src={`/images/promo-${promo}.jpg`}
                  alt={`Promoción ${promo}`}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Promo {promo}</h3>
                  <p className="text-sm text-gray-400">
                    Disfruta esta increíble promoción a un precio especial.
                  </p>
                  <button className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 items-center">
            {/* Izquierda: íconos */}
            <div className="justify-self-start flex items-center gap-5">
              <a
                href="https://www.instagram.com/mazushiciudaddeleste"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Masushi"
                className="transition hover:scale-110 hover:text-pink-500"
                title="Instagram"
              >
                <FaInstagram className="text-2xl" />
              </a>
              <a
                href="https://www.facebook.com/mazushiltda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Masushi"
                className="transition hover:scale-110 hover:text-blue-500"
                title="Facebook"
              >
                <FaFacebook className="text-2xl" />
              </a>
              <a
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp de Masushi"
                className="transition hover:scale-110 hover:text-green-500"
                title="WhatsApp"
              >
                <FaWhatsapp className="text-2xl" />
              </a>
            </div>

            {/* Centro: texto (siempre centrado) */}
            <p className="text-center">
              Masushi © {new Date().getFullYear()} - Todos los derechos
              reservados
            </p>

            {/* Derecha: espaciador para balancear el grid */}
            <div className="justify-self-end" aria-hidden />
          </div>
        </div>
      </footer>
    </div>
  );
}

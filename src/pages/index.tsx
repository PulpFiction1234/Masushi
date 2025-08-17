"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import CarritoPanel from "@/components/CarritoPanel";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { productos, type Producto } from "@/data/productos";
import { useCart } from "@/context/CartContext";
import HeroCarousel from "@/components/HeroCarousel";
import { formatCLP } from "@/utils/format";              // ← formateo de precios
import { animateToCart } from "@/utils/animateToCart";   // ← animación

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart } = useCart();

  return (
    <div className="bg-gray-950 text-white">
      {/* Navbar (si tu botón del carrito está aquí, añade data-cart-anchor allí) */}
      <Navbar />

      {/* Panel del carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero con carrusel */}
      <HeroCarousel intervalMs={9000} />

      {/* Top Rolls */}
      <section className="py-12 bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Top Rolls</h2>

          {(() => {
            const TOP_IDS = [58, 59, 60, 61];

            const topRolls: Producto[] = TOP_IDS
              .map((id) => productos.find((p) => p.id === id))
              .filter((p): p is Producto => Boolean(p));

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {topRolls.map((p) => (
                  <div key={p.id} className="bg-gray-800 rounded-lg overflow-hidden shadow">
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      width={500}
                      height={200}
                      className="w-full h-50 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm">{p.nombre}</h3>
                      <p className="text-xs text-gray-300 line-clamp-2">{p.descripcion}</p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold">{formatCLP(p.valor)}</span>
                        <button
                          onClick={(e) => {
                            addToCart(p);
                            // dispara la animación hacia el ancla del carrito
                            animateToCart(e.nativeEvent as unknown as MouseEvent);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Agregar
                        </button>
                      </div>

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
      <section className="py-12 text-gray-100">
        <div className="w-full max-w-none px-10">
          <h2 className="text-2xl font-bold text-center mb-8">Promociones</h2>

          {(() => {
            const TOP_IDS = [200, 201, 202, 203, 204];

            const topRolls: Producto[] = TOP_IDS
              .map((id) => productos.find((p) => p.id === id))
              .filter((p): p is Producto => Boolean(p));

            return (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {topRolls.map((p) => (
                  <div key={p.id} className="bg-gray-800 rounded-lg overflow-hidden shadow">
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      width={500}
                      height={300}
                      className="w-full h-62 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm">{p.nombre}</h3>
                      <p className="text-xs text-gray-300 line-clamp-2">{p.descripcion}</p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold">{formatCLP(p.valor)}</span>
                        <button
                          onClick={(e) => {
                            addToCart(p);
                            animateToCart(e.nativeEvent as unknown as MouseEvent);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Agregar
                        </button>
                      </div>

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
                className="transition hover:scale-110 "
                title="Instagram"
              >
                <FaInstagram className="text-2xl text-pink-500 hover:text-gray-100" />
              </a>
              <a
                href="https://www.facebook.com/mazushiltda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Masushi"
                className="transition hover:scale-110 "
                title="Facebook"
              >
                <FaFacebook className="text-2xl text-blue-500 hover:text-gray-100" />
              </a>
              <a
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp de Masushi"
                className="transition hover:scale-110 "
                title="WhatsApp"
              >
                <FaWhatsapp className="text-2xl text-green-500 hover:text-gray-100" />
              </a>
            </div>

            {/* Centro: texto */}
            <p className="text-center">
              Masushi © {new Date().getFullYear()} - Todos los derechos reservados
            </p>

            {/* Derecha: espaciador */}
            <div className="justify-self-end" aria-hidden />
          </div>
        </div>
      </footer>
    </div>
  );
}

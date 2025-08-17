"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import CarritoPanel from "@/components/CarritoPanel";
import Footer from "@/components/Footer";
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
      {/* Navbar */}
      <Navbar />

      {/* Panel del carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero con carrusel */}
      <HeroCarousel intervalMs={9000} />

      {/* Top Rolls */}
      <section className="py-12 bg-gray-900 text-gray-100">
        <div className="w-full max-w-none px-10">
          <h2 className="text-2xl font-bold text-center mb-8">Top Rolls</h2>

          {(() => {
            const TOP_IDS = [58, 59, 60, 61];

            const topRolls: Producto[] = TOP_IDS
              .map((id) => productos.find((p) => p.id === id))
              .filter((p): p is Producto => Boolean(p));

            return (
              <div
                className="
                  grid gap-4 justify-center items-stretch
                  [grid-template-columns:repeat(auto-fit,minmax(240px,300px))]
                  sm:[grid-template-columns:repeat(auto-fit,minmax(260px,320px))]
                "
              >
                {topRolls.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-800 rounded-lg overflow-hidden shadow flex flex-col h-full"
                  >
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      width={500}
                      height={200}
                      className="w-full h-50 object-cover"
                    />
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-sm">{p.nombre}</h3>
                      <p className="text-xs text-gray-300 line-clamp-2">{p.descripcion}</p>

                      <div className="mt-auto pt-2 flex items-center justify-between">
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
              <div
                className="
                  grid gap-4 justify-center items-stretch
                  [grid-template-columns:repeat(auto-fit,minmax(240px,300px))]
                  md:[grid-template-columns:repeat(auto-fit,minmax(260px,320px))]
                "
              >
                {topRolls.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-800 rounded-lg overflow-hidden shadow flex flex-col h-full"
                  >
                    <Image
                      src={p.imagen}
                      alt={p.nombre}
                      width={500}
                      height={300}
                      className="w-full h-62 object-cover"
                    />
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-sm">{p.nombre}</h3>
                      <p className="text-xs text-gray-300 line-clamp-2">{p.descripcion}</p>

                      <div className="mt-auto pt-2 flex items-center justify-between">
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
      <Footer />
    </div>
  );
}

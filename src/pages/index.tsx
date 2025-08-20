"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductSection from "@/components/ProductSection";

const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"));
const CarritoPanel = dynamic(
  () => import("@/components/CarritoPanel"),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-white">Cargando carrito...</div>
    ),
  }
);


export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="bg-gray-950 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Panel del carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero con carrusel */}
      <HeroCarousel intervalMs={9000} />

      {/* Top Rolls */}
         <ProductSection
        title="Top Rolls"
        productIds={[58, 59, 60, 61]}
        linkBase="/menu?producto="
      />

      {/* Promociones */}
       <ProductSection
        title="Promociones"
        productIds={[200, 201, 202, 203, 204]}
        linkBase="/menu?producto="
      />
      {/* Footer */}
      <Footer />
    </div>
  );
}

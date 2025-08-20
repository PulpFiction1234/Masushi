"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CarritoPanel from "@/components/CarritoPanel";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import ProductSection from "@/components/ProductSection";

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

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductSection from "@/components/ProductSection";
import ProductSectionPromo from "@/components/ProductSectionPromo";

import Seo from "@/components/Seo";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";

const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"));
const CarritoPanel = dynamic(() => import("@/components/CarritoPanel"), {
  ssr: false,
  loading: () => <div className="p-4 text-white">Cargando carrito...</div>,
});

// Origen absoluto para OG/LD (configura SITE_URL o NEXT_PUBLIC_SITE_URL en Vercel)
const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "";

const ogImage = ORIGIN ? `${ORIGIN}/images/logo-masushi.webp` : "/images/logo-masushi.webp";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="bg-gray-950 text-white">
      {/* Metadatos SEO */}
      <Seo
        title="Sushi a domicilio en Puente Alto | Masushi"
        description="Sushi fresco y de calidad. Delivery en Puente Alto (Ciudad del Este, El Alba, Dehesa de la Viña y Camilo Henríquez) y retiro en tienda. Promos, hot rolls y handrolls."
        canonicalPath="/"
        image={ogImage}
      />

      {/* Datos estructurados (no visible) */}
      {ORIGIN && (
        <LocalBusinessJsonLd
          name="Masushi"
          url={ORIGIN}
          telephone="+56227557931"
          image={`${ORIGIN}/images/logo-masushi.webp`}
          streetAddress="Av. Parque del Este 4400"
          addressLocality="Puente Alto"
          addressRegion="Región Metropolitana"
          postalCode="8150000"
          sameAs={[
            "https://www.instagram.com/masushiciudaddeleste",
            "https://www.instagram.com/mazushiciudaddeleste",
            "https://www.facebook.com/masushiltda",
            "https://www.facebook.com/mazushiltda",
            "https://wa.me/56940873865",
          ]}
          alternateNames={[
            "Mazushi",
            "Ma Sushi",
            "Masushi Puente Alto",
            "sushi Puente Alto",
            "sushi ciudad del este",
            "sushi el alba",
            "sushi dehesa de la viña",
            "sushi camilo henríquez",
          ]}
          serviceAreas={[
            "Puente Alto",
            "Ciudad del Este",
            "El Alba",
            "Dehesa de la Viña",
            "Camilo Henríquez",
          ]}
          menuUrl={`${ORIGIN}/menu`}
          priceRange="$$"
          acceptsReservations={false}
        />
      )}

      {/* Navbar */}
      <Navbar />

      {/* H1 SEO: claro para Google (puede ser visible si quieres) */}
      <h1 className="sr-only">
        Masushi — Sushi a domicilio en Puente Alto (Ciudad del Este, El Alba, Dehesa de la Viña y Camilo Henríquez)
      </h1>

      <main role="main">
        {/* Panel del carrito */}
        <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Hero con carrusel */}
        <section aria-label="Promociones destacadas">
          <HeroCarousel intervalMs={9000} />
        </section>

        {/* Top Rolls */}
        <section aria-labelledby="top-rolls" className="mt-4">
          <h2 id="top-rolls" className="sr-only">Top Rolls</h2>
          <ProductSection
            title="Top Rolls"
            productIds={[1, 3, 50, 56]}
            linkBase="/menu?producto="
          />
        </section>

        {/* Promociones */}
        <section aria-labelledby="promociones" className="mt-4">
          <h2 id="promociones" className="sr-only">Promociones</h2>
          <ProductSectionPromo
            title="Promociones"
            productIds={[200, 201, 202, 203, 204]}
            linkBase="/menu?producto="
          />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

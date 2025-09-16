"use client";

import { useState } from "react";
import Head from "next/head";
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

// URL absoluta del sitio (configura en Vercel: NEXT_PUBLIC_SITE_URL = https://www.masushi.cl)
const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "";

const ogImage = ORIGIN ? `${ORIGIN}/images/logo-masushi.webp` : "/images/logo-masushi.webp";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="bg-gray-950 text-white">
      {/* SEO: título con marca al inicio */}
      <Seo
        title="Masushi — Sushi a domicilio en Puente Alto"
        description="Sushi fresco y de calidad. Delivery en Puente Alto (Ciudad del Este, El Alba, Dehesa de la Viña y Camilo Henríquez) y retiro en tienda. Promos, hot rolls y handrolls."
        canonicalPath="/"
        image={ogImage}
      />

      {/* JSON-LD: WebSite (refuerza el nombre del sitio) */}
      {ORIGIN && (
        <Head>
          <script
            type="application/ld+json"
            // schema.org/WebSite con SearchAction (el buscador de la carta)
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Masushi",
                url: ORIGIN,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${ORIGIN}/menu?search={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
        </Head>
      )}

      {/* JSON-LD: LocalBusiness (ya lo tenías) */}
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

      {/* Hero con carrusel */}
      <HeroCarousel intervalMs={9000} />

      {/* H1 visible (clave para que Google no coja un producto como título) */}
      <h1
         className="mx-auto mt-4 max-w-3xl px-4 text-center text-[22px] leading-tight text-neutral-100 font-medium"
            >
        Masushi — Sushi a domicilio en Puente Alto (Ciudad del Este, El Alba y Dehesa de la Viña)
      </h1>


      {/* Top Rolls */}
      <ProductSection
        title="Top Rolls"
        productIds={[1, 3, 50, 56]}
        linkBase="/menu?producto="
      />

      {/* Promociones */}
      <ProductSectionPromo
        title="Promociones"
        productIds={[200, 201, 202, 203, 204]}
        linkBase="/menu?producto="
      />

      {/* Panel del carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

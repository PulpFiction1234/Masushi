"use client";

import { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductSection from "@/components/ProductSection";
import ProductSectionPromo from "@/components/ProductSectionPromo";
import Seo from "@/components/Seo";
import LocalBusinessJsonLd, { AggregateRatingSchema } from "@/components/LocalBusinessJsonLd";
import BirthdayReminderModal from "@/components/BirthdayReminderModal";
import { useBirthdayReminder } from "@/hooks/useBirthdayReminder";

// Importa tus datos de horarios y la función de conversión
import { getOpeningHoursSchema } from "@/utils/getOpeningHoursSchema";

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

const ogImage = ORIGIN ? `${ORIGIN}/images/hero-2.webp` : "/images/hero-2.webp";


// ----- Lógica de datos de SEO -----
// 1. Generar el esquema de horarios a partir de tu objeto de horarios
// Correcto: la función lee directamente desde el archivo `horarios.ts`
const openingHoursSchema = getOpeningHoursSchema();

// 2. Datos de calificación (ejemplo, reemplaza con los tuyos)
const myAggregateRating: AggregateRatingSchema = {
  "@type": "AggregateRating",
  ratingValue: "4.5",  // Tu calificación promedio (de 1.0 a 5.0)
  reviewCount: "228",  // El número de reseñas
};
// ----------------------------------

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const {
    isOpen: birthdayReminderOpen,
    profile: birthdayProfile,
    dismissForSession: dismissBirthdayReminder,
    dismissForever: dismissBirthdayReminderForever,
  } = useBirthdayReminder();

  return (
    <div className="bg-gray-950 text-white">
      <Seo
        title="Sushi Delivery | Masushi Ciudad del Este "
        description="Sushi fresco y de calidad. Delivery en Puente Alto (Ciudad del Este, El Alba, Dehesa de la Viña y Camilo Henríquez) y retiro en tienda. Promos, hot rolls y handrolls."
        canonicalPath="/"
        image={ogImage}
      />

      {ORIGIN && (
        <Head>
          <script
            type="application/ld+json"
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

      {ORIGIN && (
        <LocalBusinessJsonLd
          name="Masushi"
          url={ORIGIN}
          telephone="+56227557931"
          image={`${ORIGIN}/images/logo-masushi.webp`}
          streetAddress="Av. Parque del Este 4400"
          addressLocality="ciudad del este, Puente Alto"
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
          // Nuevas props para el SEO avanzado
          openingHoursSpecification={openingHoursSchema}
          aggregateRating={myAggregateRating}
        />
      )}

      <Navbar />
      <BirthdayReminderModal
        open={birthdayReminderOpen}
        onClose={dismissBirthdayReminder}
        onNeverShow={dismissBirthdayReminderForever}
        profileName={birthdayProfile?.full_name}
      />
      <HeroCarousel intervalMs={9000} />

      {/* H1 visible: Es vital para el SEO y está perfecto */}
      <h1 className="mx-auto mt-4 max-w-3xl px-4 text-center text-[22px] leading-tight text-neutral-100 font-medium">
        Sushi Delivery | Masushi Ciudad del Este 
      </h1>

      <ProductSection
        title="Top Rolls"
        productIds={[1, 3, 50, 56]}
        linkBase="/menu?producto="
      />

      <ProductSectionPromo
        title="Promociones"
        productIds={[200, 201, 202, 203, 204]}
        linkBase="/menu?producto="
      />

      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Footer />
    </div>
  );
}

// src/pages/local.tsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import dynamic from "next/dynamic";

import Seo from "@/components/Seo"; // 👈 metadatos (no visible)
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd"; // 👈 JSON-LD (no visible)

const LocalMap = dynamic(() => import("@/components/LocalMap"), {
  ssr: false,
});

// Origen absoluto para OG/LD (configura SITE_URL o NEXT_PUBLIC_SITE_URL en Vercel)
const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "";

const ogImage = ORIGIN ? `${ORIGIN}/images/logo-masushi.webp` : "/images/logo-masushi.webp";

const LOCAL = {
  nombre: "Masushi",
  direccion: "Av. Parque del Este 4400, Puente Alto, RM",
  lat: -33.561967096006185,
  lng: -70.55042547663736,
  telefono: "(2) 2755 7931",       // visible
  // Recomendado en formato E.164 para enlaces tel:
  telefonoPlain: "+56227557931",   // 👈 mejor así para <a href="tel:...">
  whatsapp: "56940873865",         // para wa.me
  horarios: [
    { dia: "Lun - Jue", horas: "16:30 – 22:30" },
    { dia: "Viernes", horas: "16:30 – 23:00" },
    { dia: "Sábado", horas: "13:30 – 22:30" },
  ],
};

export default function LocalPage() {
  return (
    <>
      {/* 🔒 Metadatos SEO */}
      <Seo
        title="Horarios, dirección y zona de reparto | Masushi Puente Alto"
        description="Revisa horarios de atención, dirección y cómo llegar. Delivery en Puente Alto con cobertura en Ciudad del Este, El Alba y Dehesa de la Viña."
        canonicalPath="/local"
        image={ogImage}
      />

      {/* 🔒 Datos estructurados (no visible) */}
      {ORIGIN && (
        <LocalBusinessJsonLd
          name="Masushi"
          url={ORIGIN}
          telephone="+56227557931" // mismo número en todo el sitio
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
          alternateNames={["Mazushi", "Ma Sushi", "Masushi Puente Alto"]}
          serviceAreas={[
            "Puente Alto",
            "Ciudad del Este",
            "El Alba",
            "Dehesa de la Viña",
          ]}
        />
      )}

      <Navbar />

      <main className="bg-gray-950 text-white">
        {/* HERO */}
        <section
          className="relative h-[300px] sm:h-[380px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: "url('/images/hero-local.webp')" }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">{LOCAL.nombre}</h1>
            <p className="text-gray-200 max-w-2xl mx-auto">
              Conoce nuestro local: ambiente cómodo, productos frescos y atención cercana.
            </p>
          </div>
        </section>

        {/* INFO + MAPA */}
        <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
          {/* Tarjeta de información */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Visítanos</h2>

            <div className="space-y-3 text-gray-200">
              <div>
                <p className="text-sm text-gray-400">Dirección</p>
                <p className="font-semibold">{LOCAL.direccion}</p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${LOCAL.telefonoPlain}`}
                  className="bg-gray-800 hover:bg-gray-700 transition px-3 py-2 rounded-lg text-sm"
                >
                  📞 Llamar
                </a>
                <a
                  href={`https://wa.me/${LOCAL.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-lg text-sm"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`https://www.google.com/maps?daddr=${LOCAL.lat},${LOCAL.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-sm"
                >
                  🗺️ Cómo llegar
                </a>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-1">Horarios</p>
                <ul className="space-y-1">
                  {LOCAL.horarios.map((h) => (
                    <li key={h.dia} className="flex justify-between border-b border-gray-800 py-1">
                      <span className="text-gray-300">{h.dia}</span>
                      <span className="font-medium">{h.horas}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <p>Valor de delivery $1500</p>
              </div>

              <div className="pt-4">
                <Link
                  href="/menu"
                  className="inline-block bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-lg font-semibold"
                >
                  Ver Menú
                </Link>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
            <LocalMap lat={LOCAL.lat} lng={LOCAL.lng} />
          </div>
        </section>

        {/* GALERÍA */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">Galería</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Image
              src="/images/puente-interior.webp"
              alt="Interior del local"
              width={500}
              height={500}
              className="w-full h-40 sm:h-48 object-cover rounded-xl border border-gray-800"
            />
            <Image
              src="/images/puente-exterior.webp"
              alt="Exterior del local"
              width={500}
              height={500}
              className="w-full h-40 sm:h-48 object-cover rounded-xl border border-gray-800"
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

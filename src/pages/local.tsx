// src/pages/local.tsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";


const LOCAL = {
  nombre: "Masushi",
  direccion: "Av. Parque del este 4400,Puente alto, RM",
  lat: -33.561967096006185,  // ← reemplaza por la lat real
  lng: -70.55042547663736,  // ← reemplaza por el lng real
  telefono: "+56 9 5418 9200", // visible
  telefonoPlain: "56954189200", // para los enlaces tel:
  whatsapp: "56954189200",      // para wa.me
  horarios: [
    { dia: "Lun - Jue", horas: "16:30 – 22:30" },
    { dia: "Viernes", horas: "16:30 – 23:00" },
    { dia: "Sábado", horas: "13:30 – 22:30" },
    ],
};

export default function LocalPage() {
  return (
    <>
      <Navbar />

      <main className="bg-gray-950 text-white">
        {/* HERO */}
        <section
          className="relative h-[300px] sm:h-[380px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: "url('/images/hero-local.jpg')" }} // ← pon tu foto
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
            <iframe
              title="Mapa del local"
              src={`https://www.google.com/maps?q=${LOCAL.lat},${LOCAL.lng}&z=16&output=embed`}
              className="w-full h-[360px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* GALERÍA */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">Galería</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Reemplaza las imágenes por las tuyas */}
            <img
              src="/images/puente-interior.jpg"
              alt="Interior del local "
              className="w-full h-40 sm:h-48 object-cover rounded-xl border border-gray-800"
            />
            <img
              src="/images/puente-exterior.jpg"
              alt="Exterior del local "
              className="w-full h-40 sm:h-48 object-cover rounded-xl border border-gray-800"
            />    
          </div>
        </section>
      </main>
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
                    Masushi © {new Date().getFullYear()} - Todos los derechos reservados
                  </p>
      
                  {/* Derecha: espaciador para balancear el grid */}
                  <div className="justify-self-end" aria-hidden />
                </div>
              </div>
             </footer>
    </>
  );
}

// src/pages/menu.tsx
"use client";

import React, { useEffect, useState, useDeferredValue } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ListaProductos from "@/components/ListaProductos";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";

// Origen absoluto para OG/LD (configura SITE_URL o NEXT_PUBLIC_SITE_URL en Vercel)
const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "";

const ogImage = ORIGIN ? `${ORIGIN}/images/logo-masushi.webp` : "/images/logo-masushi.webp";

const categorias = [
  "Roll premium", "Roll sin arroz", "Rolls envueltos en queso crema",
  "Rolls envueltos en palta", "Rolls envueltos en salmon", "California rolls",
  "Rolls vegetarianos", "Hot rolls", "Handrolls", "Hosomaki", "Sashimi",
  "Ceviche", "Nigiri", "Chirashi", "Para picar", "Bebidas", "Promociones",
];

export default function MenuPage() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🔎 estado del buscador
  const [busqueda, setBusqueda] = useState("");
  const busquedaDeferida = useDeferredValue(busqueda);

  // Router para detectar ?producto=
  const router = useRouter();
  const hasProductParam =
    typeof router.query?.producto === "string" &&
    router.query.producto.trim() !== "";

  // Bloquear scroll y cerrar con ESC cuando el menú móvil está abierto
  useEffect(() => {
    if (!menuAbierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuAbierto]);

  return (
    <>
      {/* 🔒 Metadatos SEO base de la carta */}
      <Seo
        title="Carta Masushi | Sushi en Puente Alto"
        description="Carta Masushi: roll premium, hot rolls, handrolls, sin arroz, salmón, palta, queso y promos. Delivery en Puente Alto o retiro en tienda. También nos buscan como “Mazushi”."
        canonicalPath="/menu"
        image={ogImage}
      />

      {/* 👇 Si está en /menu?producto=..., pedimos no indexar esa URL y canonical a /menu */}
      {hasProductParam && (
        <Head>
          <meta name="robots" content="noindex,follow" />
          {ORIGIN && <link rel="canonical" href={`${ORIGIN}/menu`} />}
        </Head>
      )}

      {/* JSON-LD: Migas + Menu (ayuda a Google a reconocer la carta) */}
      {ORIGIN && (
        <Head>
          {/* Migas */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": ORIGIN },
                  { "@type": "ListItem", "position": 2, "name": "Carta",  "item": `${ORIGIN}/menu` }
                ]
              }),
            }}
          />
          {/* Menu */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Menu",
                "name": "Carta Masushi",
                "url": `${ORIGIN}/menu`,
                "hasMenuSection": categorias.map((name) => ({
                  "@type": "MenuSection", name
                }))
              }),
            }}
          />
        </Head>
      )}

      <Navbar />

      {/* BOTÓN FLOTANTE (solo móvil). Se oculta cuando el menú está abierto */}
      {!menuAbierto && (
        <button
          type="button"
          aria-label="Abrir menú de categorías"
          aria-expanded={menuAbierto}
          aria-controls="mobile-categorias"
          onClick={() => setMenuAbierto(true)}
          className="
            fixed left-2 top-21 z-50 md:hidden
            bg-gray-800 text-white px-3 py-2 rounded-r-2xl rounded-l
            shadow-lg active:scale-95 transition
          "
        >
          ☰
        </button>
      )}

      <div className="bg-gray-950">
        {/* Sidebar */}
        <aside
          id="mobile-categorias"
          className={`
            fixed left-0 top-19 h-[calc(100dvh-56px)] w-64
            bg-gray-900 text-white rounded-r-2xl shadow-lg
            transform transition-transform duration-300 z-40
            flex flex-col
            ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:top-19 md:left-0 md:fixed md:w-56 md:h-[calc(100vh-56px)]
          `}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-3 pt-4 pb-2 md:pb-3">
            <h2 className="text-base font-bold">Categorías</h2>
            <button
              type="button"
              className="md:hidden text-gray-300 hover:text-white px-2 py-1 rounded"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú de categorías"
            >
              ✕
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto overscroll-contain px-2 space-y-1.5 pb-[calc(env(safe-area-inset-bottom)+24px)]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              onClick={() => {
                setCategoriaSeleccionada(null);
                setMenuAbierto(false);
              }}
              className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors duration-200 ${
                categoriaSeleccionada === null ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              Todas
            </button>

            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoriaSeleccionada(cat);
                  setMenuAbierto(false);
                }}
                className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors duration-200 ${
                  categoriaSeleccionada === cat ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Contenido */}
        <main className="min-h-screen p-6 text-center bg-gray-950 md:ml-56">
          {/* H1 + descripción centrados como el buscador */}
          <div className="flex justify-center mt-2">
            <header className="w-11/12 max-w-[19rem] sm:max-w-xs md:max-w-2xl text-center px-2 mb-3">
              <h1 className="text-[22px] font-semibold text-neutral-100">
                Carta Masushi Ciudad del Este
              </h1>
              <p className="text-[16px]  text-neutral-100 mt-1">
                Carta Masushi: calidad y frescura en cada roll. Delivery en Puente Alto y retiro en local.
              </p>
            </header>
          </div>

          {/* 🔎 Mini buscador (más angosto en móvil) */}
          <div className="sticky top-21 z-30 mb-3 flex justify-center">
            <div className="w-11/12 max-w-[19rem] sm:max-w-xs md:max-w-2xl">
              <label htmlFor="buscador" className="sr-only">
                Buscar productos por nombre, ingrediente o código
              </label>
              <div className="relative">
                <input
                  id="buscador"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, ingrediente o código…"
                  autoComplete="off"
                  className="
                    w-full rounded-lg md:rounded-xl bg-gray-800 text-white placeholder-gray-400
                    text-sm md:text-base
                    h-9 md:h-11
                    px-3 md:px-4
                    pr-8 md:pr-10
                    shadow-inner outline-none ring-1 ring-gray-700
                    focus:ring-2 focus:ring-emerald-500 transition
                  "
                  aria-describedby="hint-busqueda"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-xs md:text-base text-gray-300 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Remount por categoría (la búsqueda NO remonta) */}
          <ListaProductos
            key={`cat-${categoriaSeleccionada ?? "todas"}`}
            categoriaSeleccionada={categoriaSeleccionada}
            busqueda={busquedaDeferida}
          />
        </main>
      </div>

      {/* Overlay solo en móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

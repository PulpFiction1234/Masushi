"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ListaProductos from "@/components/ListaProductos";
import Navbar from "@/components/Navbar";

const categorias = [
  "Roll premium", "Roll sin arroz", "Rolls envueltos en queso crema",
  "Rolls envueltos en palta", "Rolls envueltos en salmon", "California rolls",
  "Rolls vegetarianos", "Hot rolls", "Handrolls", "Hosomaki", "Sashimi",
  "Ceviche", "Nigiri", "Chirashi", "Para picar", "Bebidas", "Promociones",
];

export default function MenuPage() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🔎 Medimos el alto real del Navbar (cambia entre móviles, zoom, fuentes, etc.)
  const navWrapRef = useRef<HTMLDivElement | null>(null);
  const [navH, setNavH] = useState<number>(56); // fallback

  useLayoutEffect(() => {
    const measure = () => {
      const h = navWrapRef.current?.getBoundingClientRect().height ?? 56;
      setNavH(Math.max(0, Math.round(h)));
    };
    measure();

    // Observa cambios de tamaño del navbar (p.ej., cuando cambian items/zoom)
    const ro = new ResizeObserver(() => measure());
    if (navWrapRef.current) ro.observe(navWrapRef.current);

    // Re-medimos en cambios de viewport
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  // 🔒 Lock de scroll robusto cuando el menú está abierto
  useEffect(() => {
    if (!menuAbierto) return;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      overflow: style.overflow,
      width: style.width,
    };
    const scrollY = window.scrollY;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAbierto(false);
    window.addEventListener("keydown", onKey);

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.overflow = prev.overflow;
      style.width = prev.width;
      window.removeEventListener("keydown", onKey);
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [menuAbierto]);

  return (
    <>
      {/* Envolvemos el Navbar para poder medir su alto */}
      <div ref={navWrapRef} className="relative z-50">
        <Navbar />
      </div>

      {/* BOTÓN FLOTANTE (solo móvil). Siempre bajo el navbar real */}
      {!menuAbierto && (
        <button
          type="button"
          aria-label="Abrir menú de categorías"
          aria-expanded={menuAbierto}
          aria-controls="mobile-categorias"
          onClick={() => setMenuAbierto(true)}
          className="
            fixed left-2 z-50 md:hidden
            bg-gray-800 text-white px-3 py-2 rounded-r-2xl rounded-l
            shadow-lg active:scale-95 transition
          "
          style={{ top: navH + 16 }} // 16px de separación
        >
          ☰
        </button>
      )}

      <div className="bg-gray-950">
        {/* Sidebar */}
        <aside
          id="mobile-categorias"
          role="dialog"
          aria-modal="true"
          className={`
            fixed left-0 z-40 w-64
            bg-gray-900 text-white rounded-r-2xl shadow-lg
            transform transition-transform duration-300
            flex flex-col
            ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:w-56
            overflow-y-auto overscroll-contain
          `}
          style={{
            top: navH, // empieza justo bajo el navbar medido
            height: `calc(100dvh - ${navH}px)`, // usa viewport dinámico real
            WebkitOverflowScrolling: "touch", // momentum en iOS
          }}
        >
          {/* Encabezado del panel (sticky para que no se esconda al scrollear) */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2 md:pb-3 sticky top-0 bg-gray-900">
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

          {/* Lista (el aside es quien scrollea) */}
          <div className="px-2 space-y-1.5 pb-[calc(env(safe-area-inset-bottom)+96px)]">
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

        {/* Contenido (margen en desktop para no quedar bajo el sidebar fijo) */}
        <main className="min-h-screen p-6 text-center bg-gray-950 md:ml-56">
          <ListaProductos
            key={`cat-${categoriaSeleccionada ?? "todas"}`}
            categoriaSeleccionada={categoriaSeleccionada}
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

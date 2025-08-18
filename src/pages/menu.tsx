"use client";
import React, { useEffect, useState } from "react";
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
          {/* Encabezado del panel (con botón cerrar solo en móvil) */}
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

          {/* Contenedor con scroll */}
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

        {/* Contenido: en desktop le damos margen para que no quede bajo el sidebar fijo */}
        <main className="min-h-screen p-6 text-center bg-gray-950 md:ml-56">
          {/* ⬇️ clave para FORZAR REMOUNT al cambiar de categoría */}
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

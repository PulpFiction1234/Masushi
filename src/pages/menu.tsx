// src/pages/menu.tsx
"use client";
import React, { useEffect, useState } from "react";
import ListaProductos from "@/components/ListaProductos";
import Navbar from "@/components/Navbar";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";

const categorias = [
  "Roll premium", "Roll sin arroz", "Rolls envueltos en queso crema",
  "Rolls envueltos en palta", "Rolls envueltos en salmon", "California rolls",
  "Rolls vegetarianos", "Hot rolls", "Handrolls", "Hosomaki", "Sashimi",
  "Ceviche", "Nigiri", "Chirashi", "Para picar", "Bebidas","Promociones"
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
      <Navbar onMenuToggle={() => setMenuAbierto((v) => !v)} />

      <div className="bg-gray-950">
        {/* Sidebar */}
        <aside
          className={`
            /* MÓVIL: panel deslizable debajo del navbar (~56px) */
            fixed left-0 top-29 h-[calc(100vh-56px)] w-64
            bg-gray-900 text-white rounded-r-2xl shadow-lg
            transform transition-transform duration-300 z-40
            flex flex-col
            ${menuAbierto ? "translate-x-0" : "-translate-x-full"}

            /* DESKTOP: fijo, más angosto y siempre visible */
            md:translate-x-0 md:top-29 md:left-0 md:fixed md:w-56 md:h-[calc(100vh-56px)]
          `}
        >
          <h2 className="text-base font-bold text-center mt-4 mb-3">Categorías</h2>

          {/* Contenedor con scroll */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1.5">
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
          <ListaProductos categoriaSeleccionada={categoriaSeleccionada} />
        </main>
      </div>

      {/* Overlay solo en móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      
    </>
  );
}

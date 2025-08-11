// pages/menu.tsx
"use client";
import React, { useState } from "react";
import ListaProductos from "@/components/ListaProductos";
import CarritoPanel from "@/components/CarritoPanel";
import Navbar from "@/components/Navbar";

const categorias = [
  "Roll premium",
  "Roll sin arroz",
  "Rolls envueltos en queso crema",
  "Rolls envueltos en palta",
  "Rolls envueltos en salmon",
  "California rolls",
  "Rolls vegetarianos",
  "Hot rolls",
  "Handrolls",
  "Hosomaki",
  "Sashimi",
  "Ceviche",
  "Nigiri",
  "Chirashi",
  "Para picar",
  "Bebidas",
];

export default function MenuPage() {
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <>
      {/* Navbar */}
      <Navbar onCartOpen={() => setCarritoAbierto(true)} />

      {/* Botón hamburguesa en móviles */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        ☰
      </button>

      {/* Contenedor principal */}
      <div className="flex text-center bg-gray-950">
        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-4 space-y-2 
            rounded-r-2xl shadow-lg transform transition-transform duration-300 z-40
            ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0 md:min-h-screen
          `}
        >
          <h2 className="text-lg font-bold mb-4 text-center">Categorías</h2>
          <button
            onClick={() => {
              setCategoriaSeleccionada(null);
              setMenuAbierto(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
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
              className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
                categoriaSeleccionada === cat ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </aside>

        {/* Lista de productos */}
        <main className="flex-1 p-6 bg-gray-950 min-h-screen">
          <ListaProductos categoriaSeleccionada={categoriaSeleccionada} />
        </main>
      </div>

      {/* Carrito Panel */}
      <CarritoPanel
        open={carritoAbierto}
        onClose={() => setCarritoAbierto(false)}
      />
    </>
  );
}

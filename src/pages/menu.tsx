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

  return (
    <>
      {/* Navbar */}
      <Navbar onCartOpen={() => setCarritoAbierto(true)} />

      {/* Contenedor principal */}
      <div className="flex text-center bg-gray-950">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white p-4 space-y-2 min-h-screen rounded-r-2xl shadow-lg sticky top-0">
          <h2 className="text-lg font-bold mb-4 text-center">Categorías</h2>
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            className={`block w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
              categoriaSeleccionada === null ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSeleccionada(cat)}
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

// src/pages/menu.tsx
"use client";
import React, { useState } from "react";
import ListaProductos from "@/components/ListaProductos";
import Navbar from "@/components/Navbar";

const categorias = [
  "Roll premium", "Roll sin arroz", "Rolls envueltos en queso crema",
  "Rolls envueltos en palta", "Rolls envueltos en salmon", "California rolls",
  "Rolls vegetarianos", "Hot rolls", "Handrolls", "Hosomaki", "Sashimi",
  "Ceviche", "Nigiri", "Chirashi", "Para picar", "Bebidas",
];

export default function MenuPage() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <>
      {/* Navbar con hamburguesa */}
      <Navbar onMenuToggle={() => setMenuAbierto(!menuAbierto)} />

      <div className="flex text-center bg-gray-950">
        {/* Sidebar de categorías */}
        {/* Sidebar */}
<aside
  className={`
    fixed top-0 left-0 h-full w-64 bg-gray-900 text-white 
    rounded-r-2xl shadow-lg transform transition-transform duration-300 z-40
    flex flex-col
    ${menuAbierto ? "translate-x-0" : "-translate-x-full"}
    md:static md:translate-x-0 md:min-h-screen
  `}
>
  <h2 className="text-lg font-bold text-center mt-6 mb-4">Categorías</h2>

  {/* Contenedor con scroll */}
  <div className="flex-1 overflow-y-auto px-2 space-y-2">
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
  </div>
</aside>


        {/* Lista de productos */}
        <main className="flex-1 p-6 bg-gray-950 min-h-screen">
          <ListaProductos categoriaSeleccionada={categoriaSeleccionada} />
        </main>
      </div>

      {/* Fondo oscuro al abrir menú en móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}
    </>
  );
}

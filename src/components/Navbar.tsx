// src/components/Navbar.tsx
"use client";
import Link from "next/link";
import React from "react";

interface Props {
  onMenuToggle?: () => void; // opcional, solo en menu.tsx
}

const Navbar: React.FC<Props> = ({ onMenuToggle }) => {
  return (
    <nav className="bg-gray-950 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo */}
      <div className="text-xl font-bold text-blue-600">Mazushi</div>

      {/* Links visibles en móvil y desktop */}
      <div className="flex space-x-6">
        <Link href="/" className="hover:text-blue-400">Inicio</Link>
        <Link href="/menu" className="hover:text-blue-400">Productos</Link>
        <Link href="/contacto" className="hover:text-blue-400">Contacto</Link>
      </div>

      {/* Botón hamburguesa SOLO si onMenuToggle existe */}
      {onMenuToggle && (
        <button
          className="md:hidden bg-gray-800 text-white p-2 rounded"
          onClick={onMenuToggle}
        >
          ☰
        </button>
      )}
    </nav>
  );
};

export default Navbar;

// src/components/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";

interface Props {
  onMenuToggle?: () => void; // opcional, solo en menu.tsx
}

const Navbar: React.FC<Props> = ({ onMenuToggle }) => {
  return (
    <nav className="bg-gray-950 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo (imagen clickeable al inicio) */}
      <Link href="/" aria-label="Ir al inicio" className="flex items-center gap-2">
        <Image
          src="/images/logo-masushi.png"   // pon aquí tu archivo dentro de /public
          alt="Masushi"
          width={240}               // tamaño base (puedes ajustarlo)
          height={30}
          priority                  // carga primero para que no parpadee
          className="h-15 w-30"    // controla alto con Tailwind; mantiene proporción
        />
      </Link>

      {/* Links visibles en móvil y desktop */}
      <div className="flex space-x-6">
        <Link href="/" className="hover:text-blue-400">Inicio</Link>
        <Link href="/menu" className="hover:text-blue-400">Productos</Link>
        <Link href="/local" className="hover:text-blue-400">Local</Link>
      </div>

      {/* Botón hamburguesa SOLO si onMenuToggle existe */}
      {onMenuToggle && (
        <button
          className="md:hidden bg-gray-800 text-white p-2 rounded"
          onClick={onMenuToggle}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      )}
    </nav>
  );
};

export default Navbar;

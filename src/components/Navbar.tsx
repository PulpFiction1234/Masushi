"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-950 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo (imagen clickeable al inicio) */}
      <Link href="/" aria-label="Ir al inicio" className="flex items-center gap-2">
        <Image
          src="/images/logo-masushi.png"
          alt="Masushi"
          width={240}
          height={30}
          priority
          className="h-15 w-30"
        />
      </Link>

      {/* Links visibles en móvil y desktop */}
      <div className="flex space-x-6">
        <Link href="/" className="hover:text-blue-400">Inicio</Link>
        <Link href="/menu" className="hover:text-blue-400">Productos</Link>
        <Link href="/local" className="hover:text-blue-400">Local</Link>
      </div>
    </nav>
  );
};

export default Navbar;

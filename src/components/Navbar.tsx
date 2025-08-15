// src/components/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { useCart } from "@/context/CartContext";
import { RiShoppingBag4Fill } from "react-icons/ri";
import { useRouter } from "next/router";

const Navbar: React.FC = () => {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const router = useRouter();

  const openCart = () => {
    // Dispara el evento que escucha _app.tsx
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cart"));
    }
  };

  const showCartIcon = router.pathname !== "/checkout";

  return (
    <nav className="bg-gray-950 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo */}
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

      {/* Links + Carrito */}
      <div className="flex items-center gap-6">
        <Link href="/" className="hover:text-blue-400">Inicio</Link>
        <Link href="/menu" className="hover:text-blue-400">Carta</Link>
        <Link href="/local" className="hover:text-blue-400">Local</Link>

        {showCartIcon && (
          <button
            onClick={openCart}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label={`Abrir carrito${totalItems ? `, ${totalItems} items` : ""}`}
          >
            <RiShoppingBag4Fill className="text-2xl" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 text-[11px] leading-[20px] text-white bg-red-500 rounded-full text-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

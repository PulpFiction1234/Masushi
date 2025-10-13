"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@supabase/auth-helpers-react";
import { RiShoppingBag4Fill } from "react-icons/ri";
import { FaUser, FaHeart } from "react-icons/fa";
import { useRouter } from "next/router";
import logoMasushi from "@/public/images/logo-masushi.webp";

const Navbar: React.FC = () => {
  const { cart } = useCart();
  const user = useUser();

  // ← Flag de montaje: evita diferir del SSR en el primer render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const safeCount = mounted ? totalItems : 0;

  const router = useRouter();

   const openCart = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cart"));
    }
    }, []);

  const showCartIcon = router.pathname !== "/checkout";

  return (
    <nav className="bg-gray-950 shadow-md px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo */}
      <Link href="/" aria-label="Ir al inicio" className="flex items-center gap-2">
              <Image
          src={logoMasushi}
          alt="Masushi"
          width={240}
          height={30}
          priority
          className="h-8 w-20 sm:h-10 sm:w-24 md:h-15 md:w-30"
          placeholder="blur"
          quality={60}
        />
      </Link>

      {/* Links + Carrito */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <Link href="/" className="hover:text-blue-400 text-sm sm:text-base">Inicio</Link>
        <Link href="/menu" className="hover:text-blue-400 text-sm sm:text-base">Carta</Link>
        <Link href="/menu?categoria=Promociones" className="hover:text-blue-400 text-sm sm:text-base">Promociones</Link>
        <Link href="/local" className="hover:text-blue-400 text-sm sm:text-base">Local</Link>

        {/* Botones de usuario si está logueado */}
        {mounted && user && (
          <>
            <Link
              href="/menu?categoria=Mis%20favoritos"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Mis favoritos"
            >
              <FaHeart className="text-xl text-red-500" />
            </Link>
            <Link
              href="/profile"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Mi perfil"
            >
              <FaUser className="text-xl" />
            </Link>
          </>
        )}

        {/* Botón de login si no está logueado */}
        {mounted && !user && (
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm sm:text-base rounded bg-green-600 hover:bg-green-700 transition-colors"
          >
            Ingresar
          </Link>
        )}

        {showCartIcon && (
          <button
            onClick={openCart}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label={safeCount ? `Abrir carrito, ${safeCount} items` : "Abrir carrito"}
            suppressHydrationWarning
          >
            <RiShoppingBag4Fill className="text-2xl" />
            {mounted && safeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 text-[11px] leading-[20px] text-white bg-red-500 rounded-full text-center font-bold">
                {safeCount}
              </span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);


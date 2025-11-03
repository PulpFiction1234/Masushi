"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import { FaShoppingBag, FaUserCircle, FaPhoneAlt, FaSignOutAlt } from "react-icons/fa";
import { useRouter } from "next/router";
import logoMasushi from "@/public/images/logo-masushi.webp";

const Navbar: React.FC = () => {
  const { cart } = useCart();
  const user = useUser();
  const supabase = useSupabaseClient();
  const { profile } = useUserProfile();
  const router = useRouter();

  // ← Flag de montaje: evita diferir del SSR en el primer render
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const safeCount = mounted ? totalItems : 0;

   const openCart = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cart"));
    }
    }, []);

  const showCartIcon = router.pathname !== "/checkout";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    router.push("/");
  };

  // Obtener nombre del usuario
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";

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
        <Link href="/menu" className="hover:text-blue-400 text-sm sm:text-base">Carta</Link>
        <Link href="/menu?categoria=Promociones" className="hover:text-blue-400 text-sm sm:text-base">Promociones</Link>
        <Link href="/local" className="hover:text-blue-400 text-sm sm:text-base">Local</Link>

        {/* Botón de perfil si está logueado con menú desplegable */}
        {mounted && user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Mi perfil"
            >
              <FaUserCircle className="text-2xl" aria-hidden="true" />
            </button>

            {/* Menú desplegable */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                {/* Bienvenida */}
                <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <p className="text-sm text-gray-400">Bienvenido,</p>
                  <p className="text-base font-semibold text-red-500 truncate">
                    {userName}
                  </p>
                </div>

                {/* Opciones del menú */}
                <div className="py-2">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                  >
                    <FaUserCircle className="text-xl text-white" aria-hidden="true" />
                    <span className="text-white">Mi perfil</span>
                  </Link>

                  <a
                    href="https://wa.me/56912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                  >
                    <FaPhoneAlt className="text-xl text-white" aria-hidden="true" />
                    <span className="text-white">Contáctanos</span>
                  </a>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 transition-colors text-white font-semibold"
                  >
                    <FaSignOutAlt className="text-xl" aria-hidden="true" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
            <FaShoppingBag className="text-2xl" aria-hidden="true" />
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


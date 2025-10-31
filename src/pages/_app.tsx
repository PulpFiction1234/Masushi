import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RiShoppingBag4Fill } from "react-icons/ri";

import { CartProvider, useCart } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import CarritoPanel from "@/components/CarritoPanel";
import { Analytics } from "@vercel/analytics/react";
import { useUserProfile } from '@/context/UserContext';

// 👇 OJO: Provider desde *react*, browser client desde *nextjs*
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const { cart } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const safeCount = mounted ? totalItems : 0;

  return (
    <button
      data-cart-anchor
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-red-500 text-white w-14 h-14 rounded-full shadow-lg hover:bg-gray-600 transition z-50 flex items-center justify-center"
      aria-label={safeCount ? `Abrir carrito, ${safeCount} items` : "Abrir carrito"}
      suppressHydrationWarning
    >
      <div className="relative flex items-center justify-center">
        <RiShoppingBag4Fill className="text-[32px] leading-none" />
        {mounted && safeCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
            {safeCount}
          </span>
        )}
      </div>
    </button>
  );
}

function FloatingFavoritesAnchor() {
  const { favorites } = useUserProfile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? favorites.size : 0;

  return (
    <button
      data-fav-anchor
      onClick={() => window.location.assign('/menu?cat=Mis%20favoritos')}
      className="fixed bottom-6 right-20 bg-yellow-400 text-black w-12 h-12 rounded-full shadow-lg hover:bg-yellow-500 transition z-50 flex items-center justify-center"
      aria-label={count ? `Mis favoritos, ${count} items` : 'Mis favoritos'}
    >
      <div className="relative flex items-center justify-center">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4 8 4 9.5 5 10.5 6.5 11.5 5 13 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        {mounted && count > 0 && (
          <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  // Cliente de Supabase del navegador (helpers)
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  useEffect(() => {
    const open = () => setIsCartOpen(true);
    const toggle = () => setIsCartOpen((v) => !v);
    window.addEventListener("open-cart", open);
    window.addEventListener("toggle-cart", toggle);
    return () => {
      window.removeEventListener("open-cart", open);
      window.removeEventListener("toggle-cart", toggle);
    };
  }, []);

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <UserProvider>
        <CartProvider>
          <Component {...pageProps} />

          {router.pathname !== "/checkout" && (
            <FloatingCartButton onClick={() => setIsCartOpen(true)} />
          )}

          {/* Floating favorites anchor so animateToFavorites can target it */}
          <FloatingFavoritesAnchor />

          <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <Analytics />
        </CartProvider>
      </UserProvider>
    </SessionContextProvider>
  );
}

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ShoppingBag } from "lucide-react";
import { Inclusive_Sans } from "next/font/google";

import { CartProvider, useCart } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import CarritoPanel from "@/components/CarritoPanel";
import { Analytics } from "@vercel/analytics/react";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const inclusiveSans = Inclusive_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inclusive-sans",
});

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
  <ShoppingBag className="h-8 w-8" aria-hidden="true" />
        {mounted && safeCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
            {safeCount}
          </span>
        )}
      </div>
    </button>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  const [supabaseClient] = useState(() => createPagesBrowserClient());

  useEffect(() => {
    const open = () => setIsCartOpen(true);
    const toggle = () => setIsCartOpen((value) => !value);
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
          <div className={`${inclusiveSans.className} ${inclusiveSans.variable}`}>
            <Component {...pageProps} />

            {router.pathname !== "/checkout" && (
              <FloatingCartButton onClick={() => setIsCartOpen(true)} />
            )}

            <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Analytics />
          </div>
        </CartProvider>
      </UserProvider>
    </SessionContextProvider>
  );
}

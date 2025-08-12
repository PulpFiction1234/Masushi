// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CartProvider, useCart } from "@/context/CartContext";
import CarritoPanel from "@/components/CarritoPanel";
import { useState } from "react";
import { useRouter } from "next/router";

function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-gray-500 text-white w-14 h-14 rounded-full shadow-lg hover:bg-gray-600 transition z-50 flex items-center justify-center"
    >
      <div className="relative flex items-center justify-center">
        🛒
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
            {totalItems}
          </span>
        )}
      </div>
    </button>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  return (
    <CartProvider>
      <Component {...pageProps} />

      {/* Mostrar el botón flotante solo si NO estamos en /checkout */}
      {router.pathname !== "/checkout" && (
        <FloatingCartButton onClick={() => setIsCartOpen(true)} />
      )}

      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </CartProvider>
  );
}

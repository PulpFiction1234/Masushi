// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CartProvider } from "@/context/CartContext";
import CarritoPanel from "@/components/CarritoPanel";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <Component {...pageProps} />

      {/* Botón flotante para abrir el carrito */}
 

      {/* Panel lateral */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </CartProvider>
  );
}

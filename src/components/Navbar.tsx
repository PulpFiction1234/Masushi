// src/components/Navbar.tsx
"use client";
import React from "react";
import { useCart } from "@/context/CartContext";

interface Props {
  onCartOpen: () => void;
}

const Navbar: React.FC<Props> = ({ onCartOpen }) => {
  const { cart } = useCart();

  return (
    <nav className="bg-gray-950 shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 text-white">
      {/* Logo o nombre */}
      <div className="text-xl font-bold text-blue-600">Mazushi</div>

      {/* Botón del carrito */}
      <button
        onClick={onCartOpen}
        className="relative bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        🛒 Carrito
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
      </button>
    </nav>
  );
};

export default Navbar;

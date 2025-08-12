import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CarritoPanel from "@/components/CarritoPanel";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="bg-gray-950 text-white">
      {/* Navbar con el botón que abre el carrito */}
      <Navbar />

      {/* Carrito */}
      <CarritoPanel open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero */}
      <section
        className="relative h-[500px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/hero-sushi.jpg')" }}
      >
        <div className="bg-black/50 p-6 rounded text-center">
          <h1 className="text-4xl font-bold mb-4">¡Bienvenido a Mazushi!</h1>
          <p className="text-lg mb-6">
            Sushi fresco y delicioso, directo a tu puerta.
          </p>
          <Link href="/menu">
            <button className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded text-white font-semibold">
              Ver Menú
            </button>
          </Link>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-12 bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { nombre: "Rolls", imagen: "/images/cat-rolls.jpg" },
              { nombre: "Combos", imagen: "/images/cat-combos.jpg" },
              { nombre: "Bebidas", imagen: "/images/cat-bebidas.jpg" },
              { nombre: "Postres", imagen: "/images/cat-postres.jpg" },
            ].map((cat) => (
              <Link
                key={cat.nombre}
                href={`/menu?categoria=${cat.nombre.toLowerCase()}`}
                className="block text-center"
              >
                <img
                  src={cat.imagen}
                  alt={cat.nombre}
                  className="w-full h-32 object-cover rounded-lg shadow"
                />
                <span className="mt-2 block font-semibold">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promociones */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Promociones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((promo) => (
              <div
                key={promo}
                className="border border-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition bg-gray-900"
              >
                <img
                  src={`/images/promo-${promo}.jpg`}
                  alt={`Promoción ${promo}`}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Promo {promo}</h3>
                  <p className="text-sm text-gray-400">
                    Disfruta esta increíble promoción a un precio especial.
                  </p>
                  <button className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p>
          Mazushi © {new Date().getFullYear()} - Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

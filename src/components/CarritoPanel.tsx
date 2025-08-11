import React from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CarritoPanel: React.FC<Props> = ({ open, onClose }) => {
  const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  const handlePedido = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 w-80 h-full bg-gray-900 shadow-lg transform transition-transform duration-300 z-50 text-white flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold">Carrito</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-100">
            ✖
          </button>
        </div>

        {/* LISTA CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-gray-100">Tu carrito está vacío</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between mb-3"
              >
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 ml-3">
                  <p className="font-semibold">{item.nombre}</p>
                  <p className="text-sm">
                    ${item.valor} x {item.cantidad}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                    className="px-2 py-1 border border-gray-500 rounded"
                  >
                    -
                  </button>
                  <span>{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                    className="px-2 py-1 border border-gray-500 rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 text-sm ml-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER FIJO */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-700 space-y-2 bg-gray-900 flex-shrink-0">
            <p className="font-bold">Total: ${total}</p>
            <button
              onClick={handlePedido}
              className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600"
            >
              Realizar pedido
            </button>
            <button
              onClick={clearCart}
              className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CarritoPanel;

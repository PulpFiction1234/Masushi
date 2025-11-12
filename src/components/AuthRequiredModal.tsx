"use client";

import React from "react";
import { useRouter } from "next/router";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthRequiredModal({ open, onClose }: Props) {
  const router = useRouter();
  if (!open) return null;

  const goTo = (path: string) => {
    try {
      sessionStorage.setItem('post_auth_next', '/checkout');
    } catch {}
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gray-900/95 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">¡Hola!</p>
            <h3 className="mt-2 text-xl font-semibold">Necesitas una cuenta</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="mt-4 text-sm text-neutral-300">Inicia sesión o regístrate para poder completar tu pedido.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => goTo('/login')}
            className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-gray-900 transition hover:bg-green-400"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => goTo('/register')}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-white transition hover:bg-white/10"
          >
            Registrarme
          </button>
        </div>
      </div>
    </div>
  );
}

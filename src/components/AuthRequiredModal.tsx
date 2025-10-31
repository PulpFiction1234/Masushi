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
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-neutral-900 border border-white/10 rounded-lg p-6 z-70 w-full max-w-md text-white shadow-lg">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Necesitas una cuenta</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">✖</button>
        </div>
        <p className="mt-3 text-sm text-neutral-300">Inicia sesión o regístrate para poder completar tu pedido.</p>

        <div className="mt-5 flex gap-3">
          <button onClick={() => goTo('/login')} className="flex-1 bg-white text-neutral-900 py-2 rounded hover:opacity-95">Iniciar sesión</button>
          <button onClick={() => goTo('/register')} className="flex-1 border border-white/10 text-white py-2 rounded hover:bg-white/5">Registrarme</button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUserProfile } from '@/context/UserContext';

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const ctx = useUserProfile();

  // While loading, show a minimal loading state to avoid flashing the admin UI.
  if (ctx.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  // If the user is not an admin, redirect to home (or show a 403-like message).
  if (!ctx.isAdmin) {
    useEffect(() => {
      // prefer routing to homepage; keep a simple UI here
      router.replace('/');
    }, [router]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="bg-gray-900 p-6 rounded-lg">
          <p className="text-center">No tienes permiso para ver esta página.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
      <aside className="w-64 bg-gray-900 p-6 hidden md:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Admin</h2>
        </div>
        <nav className="space-y-2 text-sm">
          <Link href="/admin/horarios" className="block px-3 py-2 rounded hover:bg-gray-800">Horarios</Link>
          <Link href="/admin/productos" className="block px-3 py-2 rounded hover:bg-gray-800">Productos</Link>
          <Link href="/admin/finanzas" className="block px-3 py-2 rounded hover:bg-gray-800">Finanzas</Link>
        </nav>
      </aside>

      <div className="flex-1 p-6 max-w-full">
        <div className="max-w-4xl mx-auto">
          {title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}

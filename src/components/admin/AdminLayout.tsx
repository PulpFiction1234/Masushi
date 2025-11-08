import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUserProfile } from '@/context/UserContext';

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const ctx = useUserProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-white">
      {/* Mobile menu button */}
      <div className="md:hidden bg-gray-900 p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Admin</h2>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar - responsive */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gray-900 p-6`}>
        <div className="mb-6 hidden md:block">
          <h2 className="text-lg font-bold">Admin</h2>
        </div>
        <nav className="space-y-2 text-sm">
          <Link 
            href="/admin/horarios" 
            className="block px-3 py-2 rounded hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Horarios
          </Link>
          <Link 
            href="/admin/productos" 
            className="block px-3 py-2 rounded hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Productos
          </Link>
          <Link 
            href="/admin/clientes" 
            className="block px-3 py-2 rounded hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Clientes
          </Link>
          <Link 
            href="/admin/finanzas" 
            className="block px-3 py-2 rounded hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Finanzas
          </Link>
        </nav>
      </aside>

      <div className="flex-1 p-4 md:p-6 max-w-full">
        <div className="max-w-4xl mx-auto">
          {title && <h1 className="text-xl md:text-2xl font-bold mb-4">{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}

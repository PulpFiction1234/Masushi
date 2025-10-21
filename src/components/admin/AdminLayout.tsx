"use client";

import React, { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="flex">
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-[calc(100vh-64px)] p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Admin</h2>
            <p className="text-xs text-gray-400">Panel de control</p>
          </div>

          <nav className="flex flex-col gap-1">
            <Link href="/admin/products" className="px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
              <span className="text-sm">Productos</span>
            </Link>
            <Link href="/admin/horarios" className="px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
              <span className="text-sm">Horarios</span>
            </Link>
            <Link href="/admin" className="px-3 py-2 rounded flex items-center gap-2 hover:bg-gray-800 text-xs text-gray-400 mt-4">
              Volver al inicio admin
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

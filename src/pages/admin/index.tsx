import React from "react";
import Link from "next/link";
import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';

export default function AdminPage() {
  return (
    <div>
      <Seo title="Panel de administracion - Masushi" canonicalPath="/admin" noIndex />
      <AdminLayout title="Panel de administración">
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-6">
          <h2 className="text-lg font-semibold">Panel de administracion</h2>
          <div className="flex gap-3">
            <Link href="/admin/horarios" className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700">Horarios</Link>
            <Link href="/admin/productos" className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700">Productos</Link>
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}

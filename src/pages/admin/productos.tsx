import React from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductsAdminPanel from '@/components/admin/ProductsAdminPanel';

export default function AdminProductosPage() {
  return (
    <div>
      <Seo title="Admin — Productos" canonicalPath="/admin/productos" noIndex />
      <AdminLayout title="Productos">
        <div className="bg-gray-900 p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-4">Productos</h1>
          <ProductsAdminPanel />
        </div>
      </AdminLayout>
    </div>
  );
}

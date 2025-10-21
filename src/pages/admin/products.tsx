import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';
import ProductsAdminPanel from '@/components/admin/ProductsAdminPanel';
import { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <Seo title="Admin — Productos" noIndex />
      <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestión de productos</h1>
        </div>
        <div className="mt-4">
          <ProductsAdminPanel />
        </div>
      </div>
    </AdminLayout>
  );
}

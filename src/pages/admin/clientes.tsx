import React from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientesAdminPanel from '@/components/admin/ClientesAdminPanel';

export default function AdminClientesPage() {
  return (
    <div>
      <Seo title="Admin — Clientes" canonicalPath="/admin/clientes" noIndex />
      <AdminLayout title="Clientes">
        <div className="bg-gray-900 p-4 md:p-6 rounded-xl shadow">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Clientes Registrados</h1>
          <ClientesAdminPanel />
        </div>
      </AdminLayout>
    </div>
  );
}

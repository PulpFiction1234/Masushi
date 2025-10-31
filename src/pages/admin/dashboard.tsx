import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';

export default function AdminDashboard() {
  return (
    <div>
      <Seo title="Admin — Dashboard" canonicalPath="/admin/dashboard" noIndex />
      <AdminLayout title="Dashboard">
        <div className="bg-gray-900 p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-300 mt-2">Resumen rapido y accesos rapidos.</p>
        </div>
      </AdminLayout>
    </div>
  );
}

import React from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';

const AddressOverridesPanel = dynamic(() => import('@/components/admin/AddressOverridesPanel'), { ssr: false });

export default function AdminDireccionesPage() {
  return (
    <div>
      <Seo title="Admin — Direcciones" canonicalPath="/admin/direcciones" noIndex />
      <AdminLayout title="Direcciones">
        <div className="bg-[#111111] p-4 md:p-6 rounded-xl shadow">
          <AddressOverridesPanel />
        </div>
      </AdminLayout>
    </div>
  );
}

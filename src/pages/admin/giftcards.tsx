import React from 'react';
import Seo from '@/components/Seo';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';

const GiftCardsAdminPanel = dynamic(() => import('@/components/admin/GiftCardsAdminPanel'), { ssr: false });

export default function AdminGiftCardsPage() {
  return (
    <div>
      <Seo title="Admin — Gift Cards" canonicalPath="/admin/giftcards" noIndex />
      <AdminLayout title="Gift Cards">
        <div className="bg-gray-900 p-4 md:p-6 rounded-xl shadow">
          <GiftCardsAdminPanel />
        </div>
      </AdminLayout>
    </div>
  );
}

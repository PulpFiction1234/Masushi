    import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';
import HorariosAdminPanel from '@/components/admin/HorariosAdminPanel';

export default function AdminHorariosPage() {
  return (
    <AdminLayout>
      <Seo title="Admin — Horarios" noIndex />
      <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Control de horarios</h1>
        </div>
        <div className="mt-4">
          <HorariosAdminPanel />
        </div>
      </div>
    </AdminLayout>
  );
}

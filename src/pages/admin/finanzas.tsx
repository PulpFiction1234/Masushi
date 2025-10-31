import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';
import FinanceChart from '@/components/admin/FinanceChart';

type ApiResp = {
  months: string[];
  series: {
    totalOrders: number[];
    deliveryOrders: number[];
    pickupOrders: number[];
    revenue: number[];
  };
  totals: {
    periodTotalOrders: number;
    periodRevenue: number;
    periodDeliveryOrders?: number;
    periodPickupOrders?: number;
    currentMonthOrders: number;
    currentMonthRevenue: number;
    currentMonthDelivery?: number;
    currentMonthPickup?: number;
  };
  recentOrders?: Array<{ id: number; total: number | string; delivery_type: number | string; created_at: string }>;
};

export default function AdminFinanzasPage() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/finance?months=6');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        setData(json as ApiResp);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  return (
    <div>
      <Seo title="Admin — Finanzas" canonicalPath="/admin/finanzas" noIndex />
      <AdminLayout title="Finanzas">
        <div className="bg-gray-900 p-6 rounded-xl shadow space-y-6">
          <h2 className="text-lg font-semibold">Resumen financiero</h2>

          {loading ? (
            <p className="text-gray-400">Cargando métricas…</p>
          ) : error ? (
            <p className="text-red-400">Error: {error}</p>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Pedidos (últimos {data.months.length} meses)</p>
                  <p className="text-2xl font-bold">{data.totals.periodTotalOrders}</p>
                  <p className="text-sm text-gray-400 mt-2">Delivery: <span className="font-semibold text-white">{data.totals.periodDeliveryOrders ?? 0}</span> • Retiro: <span className="font-semibold text-white">{data.totals.periodPickupOrders ?? 0}</span></p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Ingresos (últimos {data.months.length} meses)</p>
                  <p className="text-2xl font-bold">{money.format(data.totals.periodRevenue)}</p>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Mes actual ({data.months[data.months.length - 1]})</p>
                  <p className="text-lg">Pedidos: <span className="font-bold">{data.totals.currentMonthOrders}</span></p>
                  <p className="text-sm text-gray-400">Delivery: <span className="font-semibold text-white">{data.totals.currentMonthDelivery ?? 0}</span> • Retiro: <span className="font-semibold text-white">{data.totals.currentMonthPickup ?? 0}</span></p>
                  <p className="text-lg mt-2">Ingresos: <span className="font-bold">{money.format(data.totals.currentMonthRevenue)}</span></p>
                </div>
              </div>

              <FinanceChart data={{ months: data.months, totalOrders: data.series.totalOrders, deliveryOrders: data.series.deliveryOrders, pickupOrders: data.series.pickupOrders, revenue: data.series.revenue }} />
              {/* Recent orders table for debugging/verification */}
              <div className="bg-gray-800 p-4 rounded-lg mt-4">
                <h3 className="text-sm font-semibold mb-2">Últimos pedidos</h3>
                {data.recentOrders && data.recentOrders.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="pb-2">ID</th>
                          <th className="pb-2">Fecha</th>
                          <th className="pb-2">Tipo</th>
                          <th className="pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.map((o: any) => (
                          <tr key={o.id} className="border-t border-white/5">
                            <td className="py-2">{o.id}</td>
                            <td className="py-2 text-gray-300">{new Date(o.created_at).toLocaleString('es-CL')}</td>
                            <td className="py-2">{Number(o.delivery_type) === 1 ? 'Delivery' : 'Retiro'}</td>
                            <td className="py-2 font-medium">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(o.total) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400">No hay pedidos recientes para mostrar.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Sin datos</p>
          )}

        </div>
      </AdminLayout>
    </div>
  );
}

export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';

function monthKey(d: Date) {
  // Use UTC to match the UTC-based `start` calculation and avoid timezone shifts
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    // verify admin
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', session.user.id)
      .single();
    if (profileErr || !profile) return res.status(403).json({ error: 'Forbidden' });
    const isAdmin = Boolean((profile as any).is_admin || (profile as any).role === 'admin');
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end();
    }

    const monthsParam = Number(req.query.months ?? 6);
    const months = Number.isInteger(monthsParam) && monthsParam > 0 ? monthsParam : 6;

    // compute a conservative start date (first day of current month minus months-1)
    const now = new Date();
    const conservativeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    conservativeStart.setUTCMonth(conservativeStart.getUTCMonth() - (months - 1));

    // fetch orders since the conservative start (this ensures we get any recent orders)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, total, delivery_type, created_at')
      .gte('created_at', conservativeStart.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('/api/admin/finance supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // determine the effective end month: prefer the latest order date if present so charts include newest orders
    let endDate = new Date();
    if (orders && orders.length > 0) {
      const lastOrderDate = new Date(orders[orders.length - 1].created_at);
      if (lastOrderDate.getTime() > endDate.getTime()) endDate = lastOrderDate;
    }

    // prepare months array in chronological order ending at endDate's month
    const monthsArr: string[] = [];
    const endY = endDate.getUTCFullYear();
    const endM = endDate.getUTCMonth();
    // start month = end month - (months-1)
    const startMonthIndex = endM - (months - 1);
    for (let i = 0; i < months; i++) {
      const m = startMonthIndex + i;
      const d = new Date(Date.UTC(endY, m, 1));
      monthsArr.push(monthKey(d));
    }

    // initialize series
    const series = {
      totalOrders: monthsArr.map(() => 0),
      deliveryOrders: monthsArr.map(() => 0),
      pickupOrders: monthsArr.map(() => 0),
      revenue: monthsArr.map(() => 0),
    };

    // aggregate
    (orders || []).forEach((o: any) => {
      const dt = new Date(o.created_at);
      const key = monthKey(dt);
      const idx = monthsArr.indexOf(key);
      if (idx >= 0) {
        series.totalOrders[idx] += 1;
        const isDelivery = Number(o.delivery_type) === 1;
        if (isDelivery) series.deliveryOrders[idx] += 1;
        else series.pickupOrders[idx] += 1;
        const tot = typeof o.total === 'number' ? o.total : Number(o.total) || 0;
        series.revenue[idx] += tot;
      }
    });

    const periodTotalOrders = series.totalOrders.reduce((a, b) => a + b, 0);
    const periodRevenue = series.revenue.reduce((a, b) => a + b, 0);
  const periodDeliveryOrders = series.deliveryOrders.reduce((a, b) => a + b, 0);
  const periodPickupOrders = series.pickupOrders.reduce((a, b) => a + b, 0);

    // current month index is last element
    const currentMonthIndex = months - 1;
  const currentMonthOrders = series.totalOrders[currentMonthIndex] || 0;
  const currentMonthRevenue = series.revenue[currentMonthIndex] || 0;
  const currentMonthDelivery = series.deliveryOrders[currentMonthIndex] || 0;
  const currentMonthPickup = series.pickupOrders[currentMonthIndex] || 0;

    // also return the most recent 10 orders (for debugging / verification)
    const { data: recentOrders, error: recentErr } = await supabaseAdmin
      .from('orders')
      .select('id, total, delivery_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentErr) console.warn('/api/admin/finance recent orders warning:', recentErr.message);

    return res.status(200).json({
      months: monthsArr,
      series,
      totals: {
        periodTotalOrders,
        periodRevenue,
        periodDeliveryOrders,
        periodPickupOrders,
        currentMonthOrders,
        currentMonthRevenue,
        currentMonthDelivery,
        currentMonthPickup,
      },
      recentOrders: recentOrders ?? [],
    });
  } catch (e) {
    console.error('/api/admin/finance error', e);
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

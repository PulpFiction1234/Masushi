import React from 'react';

type Series = {
  months: string[];
  totalOrders: number[];
  deliveryOrders: number[];
  pickupOrders: number[];
  revenue: number[];
};

function prettyMonth(key: string) {
  // key: YYYY-MM -> e.g. 2025-04
  const [y, m] = key.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' }).format(date);
}

function prettyMonthShort(key: string) {
  // Avoid UTC parsing quirks: build date in UTC and format in locale
  const [y, m] = key.split('-');
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(date);
}

export function StackedBarOrders({ months, delivery, pickup }: { months: string[]; delivery: number[]; pickup: number[] }) {
  // Render grouped bars (delivery and pickup side-by-side) per month using a shared max so heights are comparable across months
  const max = Math.max(...months.map((_, i) => Math.max(delivery[i] || 0, pickup[i] || 0)), 1);
  const minBarWidth = 60; // ensure all months stay visible; overflow scrolls if needed
  const contentMinWidth = Math.max(months.length * minBarWidth, 320);

  return (
    <div className="w-full bg-gray-900 p-4 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Pedidos (Delivery vs Retiro)</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-3 items-end h-40" style={{ minWidth: `${contentMinWidth}px` }}>
          {months.map((m, i) => {
            const d = delivery[i] || 0;
            const p = pickup[i] || 0;
            // use a shared scale (max) so month-to-month differences are visible
            const innerHeightPx = 110; // px available for the bars
            const dPxRaw = Math.round((d / max) * innerHeightPx);
            const pPxRaw = Math.round((p / max) * innerHeightPx);
            const minVisiblePx = 6; // minimum pixel height
            const dPx = d > 0 ? Math.max(minVisiblePx, dPxRaw) : 2;
            const pPx = p > 0 ? Math.max(minVisiblePx, pPxRaw) : 2;
            return (
              <div key={m} className="flex-1 flex flex-col items-center text-xs" title={`${prettyMonth(m)} — Delivery: ${d} · Retiro: ${p}`}>
                
                <div className="w-full flex items-end justify-center gap-1 h-full min-h-[28px]">
                  <div className="w-1/2 h-full flex flex-col justify-end items-center">
                    <div style={{ height: `${dPx}px` }} className="bg-emerald-500 w-full flex items-center justify-center">
                      {dPx > 18 && <span className="text-[10px] text-white">{d}</span>}
                    </div>
                  </div>
                  <div className="w-1/2 h-full flex flex-col justify-end items-center">
                    <div style={{ height: `${pPx}px` }} className="bg-indigo-600 w-full flex items-center justify-center">
                      {pPx > 18 && <span className="text-[10px] text-white">{p}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-gray-300 text-[12px]">{prettyMonth(m)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 inline-block rounded-sm"/> Delivery</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-600 inline-block rounded-sm"/> Retiro</div>
      </div>
    </div>
  );
}

export function RevenueLine({ months, revenue }: { months: string[]; revenue: number[] }) {
  const max = Math.max(...revenue, 1);
  // simple polyline coordinates
  const width = 600;
  const height = 160;
  const padding = 24;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = revenue.map((r, i) => {
    const x = padding + (i / Math.max(1, months.length - 1)) * innerW;
    const y = padding + (1 - r / max) * innerH;
    return `${x},${y}`;
  }).join(' ');

  const labels = months.map((m, i) => {
    const x = padding + (i / Math.max(1, months.length - 1)) * innerW;
    return <text key={m} x={x} y={height - 6} fontSize={10} fill="#cbd5e1" textAnchor="middle">{prettyMonthShort(m)}</text>;
  });

  return (
    <div className="w-full bg-gray-900 p-4 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Ingresos (CLP)</h3>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
          <polyline fill="none" stroke="#34d399" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
          {labels}
        </svg>
      </div>
    </div>
  );
}

export default function FinanceChart({ data }: { data: Series }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StackedBarOrders months={data.months} delivery={data.deliveryOrders} pickup={data.pickupOrders} />
        <RevenueLine months={data.months} revenue={data.revenue} />
      </div>
    </div>
  );
}

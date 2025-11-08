"use client";

import React, { useState } from "react";
import ProductsAdminPanel from "./ProductsAdminPanel";
import HorariosAdminPanel from "./HorariosAdminPanel";

export default function AdminDashboard() {
  const [tab, setTab] = useState<'products'|'horarios'>('products');

  return (
    <div className="max-w-4xl mx-auto mt-4 md:mt-6 bg-gray-900 p-4 md:p-6 rounded-xl shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTab('products')}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-tl rounded-bl font-semibold text-sm md:text-base ${tab==='products' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-800/60 hover:bg-gray-800'}`}>
            Productos
          </button>
          <button
            onClick={() => setTab('horarios')}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-tr rounded-br font-semibold text-sm md:text-base ${tab==='horarios' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-800/60 hover:bg-gray-800'}`}>
            Horarios
          </button>
        </div>
        <div className="text-xs md:text-sm text-gray-400">Panel administrativo</div>
      </div>

      <div>
        {tab === 'products' ? <ProductsAdminPanel /> : <HorariosAdminPanel />}
      </div>
    </div>
  );
}

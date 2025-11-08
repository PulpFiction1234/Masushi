"use client";

import React, { useEffect, useState, useMemo } from "react";
import { normalize } from "@/utils/strings";

interface Cliente {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function ClientesAdminPanel() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/clientes');
        if (!r.ok) {
          console.error('Error fetching clientes');
          return;
        }
        const json = await r.json();
        if (!mounted) return;
        setClientes(json.clientes || []);
      } catch (e) {
        console.error('Exception fetching clientes:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const queryNorm = normalize(query).trim();
  const tokens = useMemo(() => queryNorm.split(/\s+/).filter(Boolean), [queryNorm]);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return clientes;
    return clientes.filter((c) => {
      const nombre = normalize(c.full_name || "");
      const correo = normalize(c.email || "");
      const telefono = normalize(c.phone || "");
      return tokens.every((t) => nombre.includes(t) || correo.includes(t) || telefono.includes(t));
    });
  }, [clientes, tokens]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs md:text-sm text-gray-300">
            Total de clientes registrados: <span className="font-semibold text-white">{clientes.length}</span>
          </p>
          <p className="text-xs text-gray-400">
            Mostrando: {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Buscar por nombre, correo o teléfono..." 
          className="bg-gray-800 placeholder-gray-400 text-xs md:text-sm px-3 py-2 rounded w-full sm:w-64 md:w-80" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-800 p-6 rounded text-center">
          <p className="text-gray-400">
            {query ? 'No se encontraron clientes con esos criterios de búsqueda.' : 'No hay clientes registrados.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Vista de tabla para pantallas medianas y grandes */}
          <div className="hidden md:block">
            <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Correo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">
                      {cliente.full_name || <span className="text-gray-500 italic">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{cliente.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {cliente.phone || <span className="text-gray-500 italic">Sin teléfono</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cliente.role === 'admin' 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {cliente.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(cliente.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móviles */}
          <div className="md:hidden grid gap-3">
            {filtered.map((cliente) => (
              <div key={cliente.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white mb-1">
                      {cliente.full_name || <span className="text-gray-500 italic">Sin nombre</span>}
                    </div>
                    <div className="text-xs text-gray-400">{cliente.email}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    cliente.role === 'admin' 
                      ? 'bg-purple-700 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {cliente.role}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📱</span>
                    <span className="text-gray-300">
                      {cliente.phone || <span className="text-gray-500 italic">Sin teléfono</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📅</span>
                    <span className="text-gray-400">{formatDate(cliente.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

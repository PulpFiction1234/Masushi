"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiGift, FiPhone } from "react-icons/fi";
import { normalize } from "@/utils/strings";

interface Cliente {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
  birthday: string | null;
  birthdayEligible: boolean;
  orderCount: number;
  isInBirthdayWeek: boolean;
  meetsMinMonths: boolean;
  meetsMinOrders: boolean;
  monthsRegistered: number;
  verification?: {
    verified: boolean;
    confirmed_at: string | null;
    pending_code: string | null;
    pending_expires_at: string | null;
  };
}

export default function ClientesAdminPanel() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
        const r = await fetch(`/api/admin/clientes?${params.toString()}`);
        if (!r.ok) {
          console.error('Error fetching clientes');
          return;
        }
        const json = await r.json();
        if (!mounted) return;
        setClientes(json.clientes || []);
        setTotal(json.total ?? (json.clientes?.length || 0));
      } catch (e) {
        console.error('Exception fetching clientes:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
  }, [page, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage || 1));

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(p, 1), totalPages);
    setPage(next);
  };

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let n = start; n <= end; n++) nums.push(n);
    return nums;
  }, [page, totalPages]);

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

  const formatExpires = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatBirthday = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getVerificationInfo = (cliente: Cliente) => {
    const verified = cliente.verification?.verified;
    const pendingCode = cliente.verification?.pending_code;
    const expiresAt = formatExpires(cliente.verification?.pending_expires_at ?? null);

    if (verified) {
      return {
  icon: <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />,
        content: (
          <div className="flex flex-col gap-1 text-xs text-gray-200">
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-emerald-700/80 px-2 py-1 font-semibold text-white">
            ✓ Verificada
          </span>
          {cliente.verification?.confirmed_at && (
            <span className="text-gray-400">{formatDate(cliente.verification.confirmed_at)}</span>
          )}
          </div>
        ),
      };
    }

    return {
  icon: <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />,
      content: (
        <div className="flex flex-col gap-1 text-xs text-gray-200">
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-amber-600/80 px-2 py-1 font-semibold text-white">
            Pendiente
          </span>
          {pendingCode ? (
            <>
              <span className="font-mono text-sm text-gray-200">Código: {pendingCode}</span>
              {expiresAt && <span className="text-gray-400">Expira: {expiresAt}</span>}
            </>
          ) : (
            <span className="text-gray-400">Sin código activo</span>
          )}
        </div>
      ),
    };
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
            Total de clientes registrados: <span className="font-semibold text-white">{total || clientes.length}</span>
          </p>
          <p className="text-xs text-gray-400">
            Mostrando: {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} (página {page} de {totalPages})
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Cumpleaños</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Verificación</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((cliente) => {
                  const verification = getVerificationInfo(cliente);
                  return (
                    <tr key={cliente.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-white">
                      {cliente.full_name || <span className="text-gray-500 italic">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{cliente.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {cliente.phone || <span className="text-gray-500 italic">Sin teléfono</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cliente.birthday ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-200 font-medium">{formatBirthday(cliente.birthday)}</span>
                            {cliente.birthdayEligible && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pink-600/80 px-2 py-0.5 text-xs font-semibold text-white">
                                <FiGift className="h-3 w-3" /> 10%
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center gap-1">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.isInBirthdayWeek ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-gray-400">Semana cumple</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.meetsMinMonths ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-gray-400">+1 mes ({cliente.monthsRegistered}m)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.meetsMinOrders ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-gray-400">+3 pedidos ({cliente.orderCount})</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No ingresado</span>
                      )}
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
                    <td className="px-4 py-3 text-sm text-gray-200">
                        {verification.content}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(cliente.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móviles */}
          <div className="md:hidden grid gap-3">
            {filtered.map((cliente) => {
              const verification = getVerificationInfo(cliente);
              return (
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
                    <FiPhone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <span className="text-gray-300">
                      {cliente.phone || <span className="text-gray-500 italic">Sin teléfono</span>}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiGift className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" aria-hidden />
                    {cliente.birthday ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-medium">{formatBirthday(cliente.birthday)}</span>
                          {cliente.birthdayEligible && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-600/80 px-2 py-0.5 text-xs font-semibold text-white">
                              10%
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.isInBirthdayWeek ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-gray-400">Semana</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.meetsMinMonths ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-gray-400">{cliente.monthsRegistered}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cliente.meetsMinOrders ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-gray-400">{cliente.orderCount} ped.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Sin cumpleaños</span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    {verification.icon}
                    <div className="flex-1 text-gray-300">{verification.content}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <span className="text-gray-400">{formatDate(cliente.created_at)}</span>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paginación */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-200">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="rounded border border-white/10 px-3 py-1 disabled:opacity-50"
        >
          Anterior
        </button>
        <div className="flex flex-wrap gap-1">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => goToPage(pageNumber)}
              className={`min-w-[36px] rounded px-3 py-1 text-sm ${pageNumber === page ? 'bg-lime-600 text-white' : 'border border-white/10 text-gray-200 hover:border-lime-400/50'}`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-white/10 px-3 py-1 disabled:opacity-50"
        >
          Siguiente
        </button>
        <div className="ml-auto text-xs text-gray-400">Por página: {perPage}</div>
      </div>
    </div>
  );
}

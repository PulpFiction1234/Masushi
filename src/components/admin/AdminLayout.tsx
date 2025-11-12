import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { IconType } from 'react-icons';
import { FiClock, FiLayout, FiMenu, FiPackage, FiTrendingUp, FiUsers, FiX } from 'react-icons/fi';
import { useUserProfile } from '@/context/UserContext';

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiLayout, exact: true },
  { href: '/admin/horarios', label: 'Horarios', icon: FiClock },
  { href: '/admin/productos', label: 'Productos', icon: FiPackage },
  { href: '/admin/clientes', label: 'Clientes', icon: FiUsers },
  { href: '/admin/finanzas', label: 'Finanzas', icon: FiTrendingUp },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const router = useRouter();
  const ctx = useUserProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!ctx.loading && !ctx.isAdmin) {
      router.replace('/');
    }
  }, [ctx.isAdmin, ctx.loading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  if (ctx.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!ctx.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
  <div className="bg-gray-900 p-6 rounded-lg border border-white/10 shadow-lg">
          <p className="text-center text-sm">No tienes permiso para ver esta página.</p>
        </div>
      </div>
    );
  }

  const currentPath = router.asPath.split('?')[0];
  const displayName = (ctx.profile?.full_name || '').trim() || 'Administrador';
  const secondaryLabel = ctx.profile?.role?.toUpperCase() || 'ADMINISTRADOR';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase() || 'A';

  const renderNavLink = (item: NavItem, variant: 'mobile' | 'desktop') => {
    const isActive = item.exact
      ? currentPath === item.href
      : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
    const Icon = item.icon;
    const baseClasses = 'group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition';
    const stateClasses = isActive
      ? 'border-lime-400/40 bg-lime-500/10 text-white shadow-lg shadow-lime-500/10'
      : 'border-white/5 text-gray-300 hover:border-lime-400/40 hover:bg-white/5 hover:text-white';
    const widthClasses = variant === 'mobile' ? 'w-full' : '';
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`${baseClasses} ${stateClasses} ${widthClasses}`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${isActive ? 'text-lime-300' : 'text-gray-400 group-hover:text-lime-200'}`}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3 text-sm font-semibold text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-500/15 text-lg font-bold text-lime-300">
              M
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">Masushi Admin</p>
              <p className="text-xs text-gray-400 leading-tight">Panel de control interno</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-lime-400/40 hover:text-white md:inline-flex"
            >
              Ver sitio
            </Link>
            <div className="hidden md:flex flex-col text-right leading-tight">
              <span className="text-sm font-medium text-white">{displayName}</span>
              <span className="text-xs text-gray-400 tracking-wide">{secondaryLabel}</span>
            </div>
            <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
              {initials}
            </div>
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
            >
              {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="md:hidden border-t border-white/5 px-4 pb-4">
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-gray-400">{secondaryLabel}</p>
            </div>
            <Link
              href="/"
              className="text-xs font-medium text-gray-400 transition hover:text-white"
            >
              Ver sitio
            </Link>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-gray-950/95 px-4 pb-4 pt-3">
            <nav className="grid gap-2">
              {NAV_ITEMS.map(item => renderNavLink(item, 'mobile'))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-10 pt-6 md:flex-row md:px-8">
        <aside className="hidden md:flex md:w-64 md:flex-col md:gap-4">
          <div className="rounded-2xl border border-white/5 bg-gray-950/60 p-4 shadow-xl">
            <nav className="space-y-2">
              {NAV_ITEMS.map(item => renderNavLink(item, 'desktop'))}
            </nav>
          </div>
          <div className="rounded-2xl border border-white/5 bg-gray-950/40 p-4 text-sm text-gray-400 shadow-xl">
            <p className="font-semibold text-gray-200">Consejo rápido</p>
            <p className="mt-1 leading-relaxed">
              Revisa el estado de los pedidos y actualiza horarios para mantener la operación estable.
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="rounded-3xl border border-white/5 bg-gray-950/70 p-5 shadow-2xl md:p-7">
            {title && (
              <div className="border-b border-white/5 pb-5">
                <p className="text-xs uppercase tracking-[0.35em] text-lime-400/80">Administración</p>
                <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{title}</h1>
              </div>
            )}
            <div className={title ? 'pt-5 space-y-6' : 'space-y-6'}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

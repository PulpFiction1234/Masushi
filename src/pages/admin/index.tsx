import { useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { getExpectedToken } from '@/server/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminPage() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/closed')
      .then(r => r.json())
      .then(d => setClosed(d.forceClosed));
  }, []);

  const toggle = async () => {
    const next = !closed;
    await fetch('/api/admin/closed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceClosed: next }),
    });
    setClosed(next);
  };

  const logout = async () => {
    await fetch('/api/logout');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-xl shadow space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Panel de pedidos</h1>
            <button
              onClick={logout}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold"
            >
              Cerrar sesión
            </button>
          </div>
          <p>
            Estado actual: {closed ? 'CERRADO' : 'ABIERTO'}
          </p>
          <button
            onClick={toggle}
            className={`px-4 py-2 rounded font-semibold text-white ${
              closed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {closed ? 'Abrir pedidos' : 'Cerrar pedidos'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const expected = getExpectedToken();
  const token = ctx.req.cookies?.token;
  if (!expected || token !== expected) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  return { props: {} };
};
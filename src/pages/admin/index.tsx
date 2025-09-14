import { useEffect, useState } from 'react';

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

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panel de pedidos</h1>
      <p className="mb-4">
        Estado actual: {closed ? 'CERRADO' : 'ABIERTO'}
      </p>
      <button
        onClick={toggle}
        className="px-4 py-2 rounded bg-red-600 text-white"
      >
        {closed ? 'Abrir pedidos' : 'Cerrar pedidos'}
      </button>
    </main>
  );
}

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUser } from '@supabase/auth-helpers-react';
import { fmt } from '@/utils/checkout';
import type { GiftCard } from '@/types/giftcard';
import Seo from '@/components/Seo';

const AMOUNTS = [20000, 50000, 100000];

export default function GiftCardsPage() {
  const user = useUser();
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const allowedAmounts = useMemo(() => AMOUNTS, []);

  const fetchCards = async () => {
    if (!user) {
      setGiftCards([]);
      return;
    }
    setLoadingList(true);
    try {
      const resp = await fetch('/api/giftcards');
      const json = await resp.json();
      if (resp.ok) {
        setGiftCards(Array.isArray(json?.giftCards) ? json.giftCards : []);
      }
    } catch (e) {
      console.error('Error loading gift cards', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreate = async () => {
    if (!user) {
      setError('Debes iniciar sesión para comprar una gift card.');
      return;
    }
    setError(null);
    setSuccess(null);
    setCreating(true);
    try {
      const resp = await fetch('/api/giftcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount, recipientEmail: recipientEmail.trim(), recipientName: recipientName.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json?.error || 'No se pudo crear la gift card');
        return;
      }
      setSuccess('Gift card creada. Quedará pendiente hasta que un admin la active.');
      setRecipientEmail('');
      setRecipientName('');
      await fetchCards();
    } catch (e) {
      console.error('Error creating gift card', e);
      setError('No se pudo crear la gift card');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <Seo title="Gift Cards — Masushi" canonicalPath="/giftcards" />
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-6 w-full">
        <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Regala Masushi</p>
            <h1 className="text-2xl font-bold">Gift Cards</h1>
            <p className="text-sm text-neutral-300 mt-1">Selecciona el monto, completa el correo (opcional) y la activamos una vez confirmada la transferencia.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {allowedAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${selectedAmount === amount ? 'border-green-400 bg-green-500/10 text-green-100' : 'border-white/10 bg-neutral-800 text-white hover:border-white/20'}`}
              >
                {fmt(amount)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-300">Correo del destinatario (opcional)</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="si no lo llenas, te llegará a ti"
                className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-300">Nombre del destinatario (opcional)</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-green-300">{success}</p> : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !user}
              className="rounded-full bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Comprar gift card'}
            </button>
            {!user ? <p className="text-sm text-neutral-400 self-center">Inicia sesión para continuar.</p> : null}
          </div>
        </div>

        <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold">Paga por transferencia</h2>
          <div className="rounded-xl border border-white/10 bg-neutral-800/60 p-4 text-sm text-neutral-100 leading-relaxed space-y-1">
            <p className="font-semibold text-green-200">Datos bancarios</p>
            <p>Titular: Sociedad Masushi Spa</p>
            <p>RUT: 78.229.101-7</p>
            <p>Banco: Banco Bci</p>
            <p>Cuenta corriente en pesos</p>
            <p>Número de cuenta: 10733701</p>
            <p>Correo para comprobante: masushi.spa@gmail.com</p>
            <p className="pt-1 text-neutral-200">Envía el comprobante a WhatsApp +56 9 4087 3865 para activar tu gift card.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

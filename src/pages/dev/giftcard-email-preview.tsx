import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { buildGiftcardEmailHtml, resolveSiteUrl } from '@/server/emails/giftcardEmail';
import type { GiftCard } from '@/types/giftcard';

const nowIso = new Date().toISOString();

const makeGiftCard = (code: string, amount: number): GiftCard => ({
  id: 0,
  code,
  amount_total: amount,
  amount_remaining: amount,
  status: 'active',
  purchased_by_user_id: null,
  purchaser_email: 'demo@masushi.cl',
  purchaser_name: 'Demo',
  recipient_email: 'demo@masushi.cl',
  recipient_name: 'Demo',
  claimed_by_user_id: null,
  claimed_at: null,
  activated_at: nowIso,
  activated_by: null,
  notes: null,
  created_at: nowIso,
  updated_at: nowIso,
});

const GiftcardEmailPreview = () => {
  const [code, setCode] = useState('ABC123DEF456');
  const [amount, setAmount] = useState(20000);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(resolveSiteUrl());
  }, []);

  const html = useMemo(() => {
    const card = makeGiftCard(code.trim() || 'ABC123DEF456', amount || 20000);
    return buildGiftcardEmailHtml(card, { baseUrl: baseUrl || resolveSiteUrl() });
  }, [code, amount, baseUrl]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px', maxWidth: 1024, margin: '0 auto' }}>
      <Head>
        <title>Gift Card Email Preview</title>
      </Head>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Vista previa email Gift Card</h1>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 20 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Código</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Monto</span>
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}>
            <option value={20000}>$20.000</option>
            <option value={50000}>$50.000</option>
            <option value={100000}>$100.000</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Base URL imágenes</span>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }} />
          <small style={{ color: '#666' }}>Usa https://www.masushi.cl o tu tunnel público para ver la imagen</small>
        </label>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fafafa' }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default GiftcardEmailPreview;

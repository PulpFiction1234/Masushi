import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import AdminLayout from '@/components/admin/AdminLayout';
import Seo from '@/components/Seo';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const QUICK_REPLIES = ['Sí', 'No', 'OK', 'Recibido', 'Confirmo'];

type ButtonOption = { id: string; title: string };

type WhatsAppMessage = {
  id: string;
  wa_id: string | null;
  from_number: string | null;
  to_number: string | null;
  profile_name: string | null;
  type: string | null;
  text_body: string | null;
  direction: 'in' | 'out' | string;
  payload?: unknown;
  timestamp_ms: number | null;
  created_at: string;
};

function formatTs(m: WhatsAppMessage) {
  const ts = m.timestamp_ms ? Number(m.timestamp_ms) : Date.parse(m.created_at);
  if (!Number.isFinite(ts)) return '';
  return new Date(ts).toLocaleString('es-CL', { hour12: false });
}

function MessageBubble({ msg, buttons, onSelectButton }: { msg: WhatsAppMessage; buttons: ButtonOption[]; onSelectButton?: (opt: ButtonOption) => void }) {
  const inbound = msg.direction !== 'out';
  const badge = inbound ? 'Entrante' : 'Saliente';
  return (
    <div className={`flex ${inbound ? '' : 'justify-end'}`}>
      <div className={`max-w-xl rounded-2xl border px-4 py-3 shadow ${inbound ? 'border-lime-400/30 bg-lime-900/20 text-lime-50' : 'border-cyan-400/30 bg-cyan-900/20 text-cyan-50'}`}>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide opacity-80">
          <span>{badge}</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-200">{formatTs(msg)}</span>
        </div>
        <div className="mt-1 text-sm whitespace-pre-wrap text-white">{msg.text_body || `[${msg.type || 'mensaje'}]`}</div>
        <div className="mt-1 text-[11px] text-gray-300">wa_id: {msg.wa_id || '—'}</div>
        {inbound && buttons.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {buttons.map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onSelectButton?.(btn)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-lime-300/70 hover:text-lime-100"
              >
                {btn.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminChat() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { data: allData, isLoading: loadingAll, mutate: mutateAll } = useSWR('/api/admin/whatsapp-messages?limit=200', fetcher, { refreshInterval: 15000 });
  const { data: convoData, isLoading: loadingConvo, mutate: mutateConvo } = useSWR(
    selectedPhone ? `/api/admin/whatsapp-messages?phone=${encodeURIComponent(selectedPhone)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const conversations = useMemo(() => {
    const msgs: WhatsAppMessage[] = allData?.messages || [];
    const map = new Map<string, WhatsAppMessage>();
    for (const msg of msgs) {
      const phone = msg.from_number || 'desconocido';
      if (!map.has(phone)) {
        map.set(phone, msg);
      }
    }
    return Array.from(map.entries())
      .map(([phone, lastMsg]) => ({ phone, lastMsg }))
      .sort((a, b) => {
        const ats = a.lastMsg.timestamp_ms || Date.parse(a.lastMsg.created_at);
        const bts = b.lastMsg.timestamp_ms || Date.parse(b.lastMsg.created_at);
        return (bts || 0) - (ats || 0);
      });
  }, [allData?.messages]);

  const messages: WhatsAppMessage[] = convoData?.messages || [];

  function extractButtons(msg: WhatsAppMessage): ButtonOption[] {
    const p: any = msg?.payload;
    const buttons: ButtonOption[] = [];
    const arr = p?.interactive?.action?.buttons;
    if (Array.isArray(arr)) {
      for (const b of arr) {
        const id = b?.reply?.id || b?.id || '';
        const title = b?.reply?.title || b?.title || '';
        if (id && title) buttons.push({ id, title });
      }
    }
    return buttons;
  }

  async function handleSend(customText?: string) {
    if (!selectedPhone) return;
    const text = (customText ?? draft).trim();
    if (!text) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/admin/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedPhone, text }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }
      if (!customText) setDraft('');
      mutateConvo();
      mutateAll();
    } catch (err: any) {
      setSendError(err?.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  function handleQuickReply(text: string) {
    if (sending) return;
    handleSend(text);
  }

  function handleButtonReply(opt: ButtonOption) {
    if (!selectedPhone || sending) return;
    setSending(true);
    setSendError(null);
    fetch('/api/admin/whatsapp-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: selectedPhone, buttonPayload: opt.id, buttonTitle: opt.title }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
        mutateConvo();
        mutateAll();
      })
      .catch(err => setSendError(err?.message || 'No se pudo enviar'))
      .finally(() => setSending(false));
  }

  return (
    <div>
      <Seo title="Admin — Chat" canonicalPath="/admin/chat" noIndex />
      <AdminLayout title="Chat">
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-gray-950/70 p-4 shadow-xl">
            <div className="flex items-center justify-between text-sm font-semibold text-white">
              <span>Conversaciones</span>
              <button
                type="button"
                onClick={() => { mutateAll(); if (selectedPhone) mutateConvo(); }}
                className="text-xs rounded-full border border-white/10 px-3 py-1 text-gray-200 hover:border-lime-400/50 hover:text-white"
              >Refrescar</button>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Solo se muestran mensajes entrantes guardados desde el webhook.
            </div>
            <div className="mt-3 space-y-2 max-h-[70vh] overflow-auto pr-1">
              {loadingAll ? (
                <p className="text-sm text-gray-400">Cargando…</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-gray-400">Sin mensajes registrados.</p>
              ) : (
                conversations.map(({ phone, lastMsg }) => (
                  <button
                    key={phone}
                    type="button"
                    onClick={() => setSelectedPhone(phone)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${selectedPhone === phone ? 'border-lime-400/50 bg-lime-900/20 text-white' : 'border-white/10 bg-white/5 text-gray-100 hover:border-lime-400/40 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{phone}</span>
                      <span className="text-[11px] text-gray-400">{formatTs(lastMsg)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300 truncate">{lastMsg.text_body || `[${lastMsg.type || 'mensaje'}]`}</div>
                    {lastMsg.profile_name ? (
                      <div className="mt-0.5 text-[11px] text-gray-400">{lastMsg.profile_name}</div>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gray-950/70 p-4 shadow-2xl min-h-[60vh]">
            {!selectedPhone ? (
              <div className="text-sm text-gray-300">Selecciona una conversación para ver los mensajes.</div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{selectedPhone}</div>
                    <div className="text-xs text-gray-400">Últimos mensajes entrantes</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => mutateConvo()}
                    className="text-xs rounded-full border border-white/10 px-3 py-1 text-gray-200 hover:border-lime-400/50 hover:text-white"
                  >Actualizar</button>
                </div>
                <div className="flex-1 space-y-3 overflow-auto pr-1">
                  {loadingConvo ? (
                    <p className="text-sm text-gray-400">Cargando…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin mensajes para este número.</p>
                  ) : (
                    messages
                      .slice()
                      .sort((a, b) => {
                        const ats = a.timestamp_ms || Date.parse(a.created_at);
                        const bts = b.timestamp_ms || Date.parse(b.created_at);
                        return (ats || 0) - (bts || 0);
                      })
                      .map(msg => {
                        const buttons = extractButtons(msg);
                        return (
                          <MessageBubble
                            key={msg.id || msg.wa_id || Math.random().toString(36)}
                            msg={msg}
                            buttons={buttons}
                            onSelectButton={buttons.length ? handleButtonReply : undefined}
                          />
                        );
                      })
                  )}
                </div>
                <div className="mt-3 border-t border-white/5 pt-3">
                  {sendError ? <div className="mb-2 text-xs text-red-300">{sendError}</div> : null}
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-gray-200">
                    {QUICK_REPLIES.map(q => (
                      <button
                        key={q}
                        type="button"
                        disabled={sending}
                        onClick={() => handleQuickReply(q)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:border-lime-400/50 hover:text-white disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="Escribe tu respuesta…"
                      className="min-h-[72px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-lime-400/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={sending || !draft.trim()}
                      className="self-end rounded-xl border border-lime-400/60 bg-lime-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? 'Enviando…' : 'Enviar'}
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">Se envía como texto simple al número seleccionado.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}

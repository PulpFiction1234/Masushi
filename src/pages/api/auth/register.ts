import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import createAndSendCustomVerification from '@/server/customVerification';
import { buildFullName } from '@/utils/name';
import { ensureSupabasePassword } from '@/utils/strings';

const attemptVerificationSend = async (userId: string, email: string) => {
  const normalized = email.trim().toLowerCase();
  try {
    const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: normalized });
    if (!resendErr) {
      console.log('[register] Supabase resend succeeded');
      return { method: 'supabase' as const };
    }
    console.warn('[register] Supabase resend reported error, using fallback', resendErr);
  } catch (resendCatch) {
    console.warn('[register] Supabase resend threw, using fallback', resendCatch);
  }

  const fallback = await createAndSendCustomVerification(userId, normalized);
  console.log('[register] custom verification dispatched');
  return { method: 'custom' as const, expires_at: fallback.expiresAt.toISOString() };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, phone, apellidoPaterno, apellidoMaterno } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  };

  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawPassword = String(password ?? '').trim();

  if (!normalizedEmail || !rawPassword) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  if (!/^\d{4}$/.test(rawPassword)) {
    return res.status(400).json({ error: 'El pin debe tener exactamente 4 dígitos.' });
  }

  const safePassword = ensureSupabasePassword(rawPassword);

  try {
    const findUserByEmail = async () => {
      let page = 1;
      const perPage = 200;
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage, page });
        if (error) throw error;
        const collection = data?.users ?? [];
        if (Array.isArray(collection)) {
          const match = collection.find((u) => (u.email || '').toLowerCase() === normalizedEmail);
          if (match) return match;
          if (collection.length < perPage) return null;
        } else {
          return null;
        }
        page += 1;
      }
    };

    const existingUser = await findUserByEmail();

    if (existingUser) {
      if (existingUser?.email_confirmed_at) {
        return res.status(409).json({ error: 'El correo ya está registrado y verificado' });
      }

      const verification = await attemptVerificationSend(existingUser.id, existingUser.email || normalizedEmail);

      return res.status(200).json({ ok: true, userId: existingUser.id, status: 'existing', verification });
    }

    // Construir nombre completo de forma segura evitando duplicados
    const nombreCompleto = buildFullName(name?.trim() || '', apellidoPaterno?.trim() || '', apellidoMaterno?.trim() || '') || 'Usuario';

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: safePassword,
      email_confirm: false,
      user_metadata: {
        full_name: nombreCompleto,
        phone: phone || '',
        apellido_paterno: apellidoPaterno || '',
        apellido_materno: apellidoMaterno || '',
      },
    });

    if (createErr) {
      console.error('[register] createUser error', createErr);
      return res.status(500).json({ error: createErr.message || String(createErr) });
    }

    const userId = created?.user?.id || null;
    if (!userId) {
      return res.status(500).json({ error: 'No pudimos crear tu usuario' });
    }

    const verification = await attemptVerificationSend(userId, normalizedEmail);

    return res.status(200).json({ ok: true, userId, status: 'created', verification });
  } catch (err: unknown) {
    console.error('[register] unexpected error', err);
    const message = err && typeof err === 'object' && 'message' in err ? err.message : undefined;
    return res.status(500).json({ error: message || 'Error registrando usuario' });
  }
}

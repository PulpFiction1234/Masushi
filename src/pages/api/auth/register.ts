import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import { buildFullName } from '@/utils/name';

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
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const findUserByEmail = async () => {
      let page = 1;
      const perPage = 200;
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage, page });
        if (error) throw error;
        const collection = (data as any)?.users ?? data ?? [];
        if (Array.isArray(collection)) {
          const match = collection.find((u: any) => (u?.email || '').toLowerCase() === normalizedEmail);
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

      // Construir nombre completo de forma segura evitando duplicados
      const nombreCompleto = buildFullName(name?.trim() || '', apellidoPaterno?.trim() || '', apellidoMaterno?.trim() || '') || 'Usuario';

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: false,
        user_metadata: {
          full_name: nombreCompleto,
          phone: phone || existingUser?.user_metadata?.phone || '',
          apellido_paterno: apellidoPaterno || existingUser?.user_metadata?.apellido_paterno || '',
          apellido_materno: apellidoMaterno || existingUser?.user_metadata?.apellido_materno || '',
        },
      });

      if (updateErr) {
        console.error('[register] update existing user error', updateErr);
        return res.status(500).json({ error: 'No pudimos actualizar el usuario existente' });
      }

      // Try to have Supabase send its OTP email (preferred). If that fails,
      // fall back to our custom verification generation and SMTP send.
      try {
        const emailTo = existingUser.email || normalizedEmail;
        if (emailTo) {
          const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: String(emailTo).toLowerCase() });
          if (!resendErr) {
            console.log('[register] Supabase resend succeeded for existing user', existingUser.id);
          } else {
            console.warn('[register] Supabase resend reported error for existing user (no fallback)', resendErr);
          }
        }
      } catch (e) {
        console.warn('[register] could not request supabase resend for existing user (no fallback)', e);
      }

      return res.status(200).json({ ok: true, userId: existingUser.id, status: 'existing' });
    }

    // Construir nombre completo de forma segura evitando duplicados
    const nombreCompleto = buildFullName(name?.trim() || '', apellidoPaterno?.trim() || '', apellidoMaterno?.trim() || '') || 'Usuario';

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
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

    const userId = (created as any)?.user?.id || (created as any)?.id || null;
    if (!userId) {
      return res.status(500).json({ error: 'No pudimos crear tu usuario' });
    }

    // Ask Supabase to send its OTP email (preferred). If it fails, fall back
    // to our custom code+SMTP path.
    try {
      if (normalizedEmail) {
        const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: normalizedEmail });
        if (!resendErr) {
          console.log('[register] Supabase resend succeeded for new user', userId);
        } else {
          console.warn('[register] Supabase resend reported error for new user (no fallback)', resendErr);
        }
      }
    } catch (e) {
      console.warn('[register] could not request supabase resend for new user (no fallback)', e);
    }

    return res.status(200).json({ ok: true, userId, status: 'created' });
  } catch (err: any) {
    console.error('[register] unexpected error', err);
    return res.status(500).json({ error: err?.message || 'Error registrando usuario' });
  }
}

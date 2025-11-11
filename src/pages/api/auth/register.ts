import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

// Helper to create and send a verification code (15 minutes expiry)
async function createAndSendVerification(targetUserId: string, targetEmail: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('email_verifications')
    .insert({ user_id: targetUserId, code, expires_at: expiresAt.toISOString() })
    .select()
    .single();

  if (insertErr) {
    console.error('[register] insert verification error', insertErr);
    return { ok: false, details: insertErr.message || insertErr };
  }

  // send email with code
  const subject = 'Código de verificación — Masushi';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;background:#fff;">
      <h2 style="color:#1f2937">Código de verificación</h2>
      <div style="font-family:monospace;font-size:28px;color:#ef4444;margin:20px 0;">${code}</div>
      <p>Este código expira en 15 minutos.</p>
    </div>`;

  try {
    await sendEmail(targetEmail, subject, html, `Tu código: ${code}`);
  } catch (e) {
    console.warn('[register] could not send verification email', e);
  }

  return { ok: true, codeInsertedId: (inserted as any)?.id };
}

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

      // Construir nombre completo: nombre + apellido paterno + apellido materno
      const nombreCompleto = [
        name?.trim() || '',
        apellidoPaterno?.trim() || '',
        apellidoMaterno?.trim() || ''
      ].filter(Boolean).join(' ') || 'Usuario';

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

      // create and send verification code for existing user (best-effort)
      try {
        const emailTo = existingUser.email || normalizedEmail;
        if (emailTo) await createAndSendVerification(existingUser.id, String(emailTo));
      } catch (e) {
        console.warn('[register] could not create/send verification for existing user', e);
      }

      return res.status(200).json({ ok: true, userId: existingUser.id, status: 'existing' });
    }

    // Construir nombre completo: nombre + apellido paterno + apellido materno
    const nombreCompleto = [
      name?.trim() || '',
      apellidoPaterno?.trim() || '',
      apellidoMaterno?.trim() || ''
    ].filter(Boolean).join(' ') || 'Usuario';

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

    // create and send verification code for newly created user
    try {
      const emailTo = normalizedEmail;
      if (emailTo) await createAndSendVerification(userId, emailTo);
    } catch (e) {
      console.warn('[register] could not create/send verification for new user', e);
    }

    return res.status(200).json({ ok: true, userId, status: 'created' });
  } catch (err: any) {
    console.error('[register] unexpected error', err);
    return res.status(500).json({ error: err?.message || 'Error registrando usuario' });
  }
}

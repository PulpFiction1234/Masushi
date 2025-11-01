import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, phone } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
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

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: false,
        user_metadata: {
          full_name: name || existingUser?.user_metadata?.full_name || 'Usuario',
          phone: phone || existingUser?.user_metadata?.phone || '',
        },
      });

      if (updateErr) {
        console.error('[register] update existing user error', updateErr);
        return res.status(500).json({ error: 'No pudimos actualizar el usuario existente' });
      }

      return res.status(200).json({ ok: true, userId: existingUser.id, status: 'existing' });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: name || 'Usuario',
        phone: phone || '',
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

    return res.status(200).json({ ok: true, userId, status: 'created' });
  } catch (err: any) {
    console.error('[register] unexpected error', err);
    return res.status(500).json({ error: err?.message || 'Error registrando usuario' });
  }
}

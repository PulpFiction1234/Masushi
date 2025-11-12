import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import { buildFullName } from '@/utils/name';

type VerificationRow = {
  user_id: string;
  code: string | null;
  used: boolean | null;
  expires_at: string | null;
  created_at: string | null;
};

// Protected admin endpoint to list all registered users (clients).
// Returns: id, email, full_name, phone, created_at, role

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('[admin:clientes] error listing users', authError);
      return res.status(500).json({ error: authError.message || String(authError) });
    }

    const users = authUsers?.users || [];
    
    // Get corresponding profiles from public.profiles
    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      return res.status(200).json({ clientes: [] });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at, apellido_paterno, apellido_materno')
      .in('id', userIds);

    if (profilesError) {
      console.error('[admin:clientes] error fetching profiles', profilesError);
      // Continue without profiles data
    }

    // Fetch latest verification codes (if any) for these users
    const { data: verifications, error: verificationError } = await supabaseAdmin
      .from('email_verifications')
      .select('user_id, code, used, expires_at, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (verificationError) {
      console.error('[admin:clientes] error fetching verifications', verificationError);
    }

    const verificationMap = new Map<string, VerificationRow>();
    if (Array.isArray(verifications)) {
      for (const row of verifications as VerificationRow[]) {
        if (!verificationMap.has(row.user_id)) {
          verificationMap.set(row.user_id, row);
        }
      }
    }

    // Merge auth users with profile data
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const clientes = users.map(user => {
      const profile = profilesMap.get(user.id) as any;
      const verificationRow = verificationMap.get(user.id);
      const nowTs = Date.now();
      let pendingCode: string | null = null;
      let pendingExpiresAt: string | null = null;

      if (verificationRow && !verificationRow.used && verificationRow.code) {
        const expiresAtTs = verificationRow.expires_at ? new Date(verificationRow.expires_at).getTime() : null;
        if (!expiresAtTs || expiresAtTs >= nowTs) {
          pendingCode = verificationRow.code;
          pendingExpiresAt = verificationRow.expires_at;
        }
      }
      
      // Construir nombre completo de forma segura evitando duplicados
      const apellidoPaterno = profile?.apellido_paterno || user.user_metadata?.apellido_paterno || '';
      const apellidoMaterno = profile?.apellido_materno || user.user_metadata?.apellido_materno || '';
      const nombreCompleto = buildFullName(profile?.full_name || user.user_metadata?.full_name || '', apellidoPaterno, apellidoMaterno);
      
      return {
        id: user.id,
        email: user.email || '',
        full_name: nombreCompleto,
        phone: profile?.phone || user.user_metadata?.phone || '',
        role: profile?.role || 'user',
        created_at: profile?.created_at || user.created_at,
        verification: {
          verified: Boolean(user.email_confirmed_at),
          confirmed_at: user.email_confirmed_at || null,
          pending_code: pendingCode,
          pending_expires_at: pendingExpiresAt,
        },
      };
    });

    // Sort by created_at desc (newest first)
    clientes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json({ clientes });
  } catch (e: any) {
    console.error('[admin:clientes] exception', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

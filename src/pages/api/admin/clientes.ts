import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import { buildFullName } from '@/utils/name';

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

    // Merge auth users with profile data
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const clientes = users.map(user => {
      const profile = profilesMap.get(user.id) as any;
      
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

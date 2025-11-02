import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { computeBirthdayEligibility } from '@/server/birthdayEligibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const eligibility = await computeBirthdayEligibility(session.user.id);
    return res.status(200).json({ eligibility });
  } catch (error) {
    console.error('Error computing birthday eligibility:', error);
    return res.status(500).json({ error: 'No se pudo obtener el estado del descuento de cumpleaños' });
  }
}

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const role = session?.user.user_metadata?.role;

  if (!error && session && role === 'admin') {
    return res;
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Auth required', { status: 401 });
  }

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}
// Protege /admin y los endpoints /api/admin/**
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
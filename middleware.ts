import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (token) {
    try {
      const { verifyToken } = await import('@/server/auth');
      if (verifyToken(token)) {
        return NextResponse.next();
      }
    } catch (err) {
      console.error(err);
      return new NextResponse('Server misconfigured', { status: 500 });
    }
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Auth required', { status: 401 });
  }

  const url = new URL('/login', req.url);
  return NextResponse.redirect(url);
}
// Protege /admin y los endpoints /api/admin/**
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
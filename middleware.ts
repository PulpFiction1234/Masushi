import { NextRequest, NextResponse } from 'next/server';
import { getExpectedToken } from '@/server/auth';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const expected = getExpectedToken();

  if (expected && token === expected) {
    return NextResponse.next();
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
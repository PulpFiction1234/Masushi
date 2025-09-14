import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');

  if (auth) {
    const [user, pass] = atob(auth.split(' ')[1]).split(':');
    if (
      user === process.env.ADMIN_USER &&
      pass === process.env.ADMIN_PASS
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
  });
}

// Protege /admin y los endpoints /api/admin/**
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
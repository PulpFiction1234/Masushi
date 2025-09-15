import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Si hay sesión, permitir paso
  if (session) return res;

  // Bloquear API protegida
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse("Auth required", { status: 401 });
  }

  // Redirigir páginas protegidas
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

// Protege /admin y /api/admin/**
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Nur Admin-Routen schützen (nicht die Login-Seite selbst)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = req.cookies.get("admin_auth");
    if (cookie?.value !== "1") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

  // middleware.ts
  import { NextRequest, NextResponse } from "next/server";

  /**
   * Middleware schützt alle /admin/**-Routen:
   * - Wenn kein Cookie "admin_auth=1": Redirect auf /admin/login
   * - /admin/login bleibt frei zugänglich
   */
  export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Nur Admin-Routen schützen, aber Login zulassen
    const isAdminPath = pathname.startsWith("/admin");
    const isLogin = pathname === "/admin/login";

    if (!isAdminPath || isLogin) {
      return NextResponse.next();
    }

    const cookie = req.cookies.get("admin_auth");
    const isAuthed = cookie?.value === "1";

    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Diese Middleware greift auf alle /admin/** Routen
  export const config = {
    matcher: ["/admin/:path*"],
  };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Verifiziert den admin_auth-Cookie mit HMAC-SHA256.
 * Verwendet Web Crypto API (Edge-Runtime kompatibel).
 * Muss identisch zur Logik in app/api/admin/_auth.ts sein.
 */
async function isValidAdminCookie(value: string): Promise<boolean> {
  const secret = process.env.ADMIN_KEY ?? "";
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const nonce = value.slice(0, dotIndex);
  const providedHmac = value.slice(dotIndex + 1);
  if (!nonce || !providedHmac) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(nonce));
    const computedHmac = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time string comparison
    if (computedHmac.length !== providedHmac.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedHmac.length; i++) {
      mismatch |= computedHmac.charCodeAt(i) ^ providedHmac.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = req.cookies.get("admin_auth");

    // Cookie fehlt oder Signatur ungültig → Login
    if (!cookie?.value || !(await isValidAdminCookie(cookie.value))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

import crypto from "crypto";

function computeHmac(nonce: string): string {
  const secret = process.env.ADMIN_KEY ?? "";
  return crypto.createHmac("sha256", secret).update(nonce).digest("hex");
}

/** Generates a signed cookie value for the admin session. */
export function makeAdminCookieValue(): string {
  const nonce = crypto.randomBytes(32).toString("hex");
  const hmac = computeHmac(nonce);
  return `${nonce}.${hmac}`;
}

/** Verifies the admin_auth cookie using HMAC — prevents simple cookie forgery. */
export function isAdminAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookiePart = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("admin_auth="));
  if (!cookiePart) return false;

  const value = decodeURIComponent(cookiePart.trim().slice("admin_auth=".length));
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const nonce = value.slice(0, dotIndex);
  const hmac = value.slice(dotIndex + 1);
  if (!nonce || !hmac) return false;

  try {
    const expected = computeHmac(nonce);
    const a = Buffer.from(hmac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

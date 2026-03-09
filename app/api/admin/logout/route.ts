// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Cookie löschen
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_auth", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, // sofort ablaufen
  });
  return res;
}

import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/app/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const s = await getPlatformSettings();
  return NextResponse.json(s);
}

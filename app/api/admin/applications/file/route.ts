// app/api/admin/applications/file/route.ts
// Proxies uploaded applicant PDFs only to authenticated admins (DSGVO Art. 5, 32)
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/app/api/admin/_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return new NextResponse("Nicht autorisiert.", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("name") ?? "";

  // Only allow fetching from Vercel Blob URLs
  if (!url.startsWith("https://") || !url.includes("vercel-storage.com")) {
    return new NextResponse("Ungültige Datei-URL.", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    if (!res.ok) return new NextResponse("Datei nicht gefunden.", { status: 404 });

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bewerbung.pdf"`,
        "Cache-Control": "no-store, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Datei nicht gefunden.", { status: 404 });
  }
}

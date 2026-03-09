// app/api/admin/applications/file/route.ts
// Serves uploaded applicant PDFs only to authenticated admins (DSGVO Art. 5, 32)
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return new NextResponse("Nicht autorisiert.", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "";

  // Prevent path traversal
  if (!name || /[/\\.]\./.test(name) || name.includes("/") || name.includes("\\")) {
    return new NextResponse("Ungültiger Dateiname.", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "private-uploads", name);

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "no-store, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Datei nicht gefunden.", { status: 404 });
  }
}

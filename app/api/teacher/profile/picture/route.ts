import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

/**
 * POST /api/teacher/profile/picture
 * FormData: { email, file }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string | null)?.trim().toLowerCase();
    const file = formData.get("file") as File | null;

    if (!email || !file) {
      return NextResponse.json({ error: "email und file benoetigt" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher nicht gefunden" }, { status: 404 });
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Datei zu groß. Maximal 5 MB erlaubt." }, { status: 400 });
    }

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json({ error: "Nur Bilder erlaubt (jpg, png, webp, gif)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `profiles/teacher-${teacher.id}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    });

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { profilePicture: blob.url },
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err: any) {
    logError("app/api/teacher/profile/picture POST", err).catch(() => {});
    console.error("profile/picture error:", err);
    return NextResponse.json({ error: err?.message ?? "Serverfehler" }, { status: 500 });
  }
}

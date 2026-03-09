import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logError } from "@/app/lib/logError";
import fs from "fs";
import path from "path";

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

    const filename = `${Date.now()}-teacher-${teacher.id}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);

    const url = `/uploads/profiles/${filename}`;

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { profilePicture: url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    logError("app/api/teacher/profile/picture POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

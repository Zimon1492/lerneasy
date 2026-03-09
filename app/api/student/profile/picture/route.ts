import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "file fehlt" }, { status: 400 });
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

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const filename = `${Date.now()}-student-${user.id}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);

    const url = `/uploads/profiles/${filename}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    logError("app/api/student/profile/picture POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

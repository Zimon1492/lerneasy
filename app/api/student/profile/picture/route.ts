import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getStudentSession } from "@/app/lib/auth";
import { logError } from "@/app/lib/logError";
import { put } from "@vercel/blob";

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

    const filename = `profiles/student-${user.id}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: blob.url },
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    logError("app/api/student/profile/picture POST", err).catch(() => {});
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

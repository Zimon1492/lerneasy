// app/api/teachers/apply/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { logError } from "@/app/lib/logError";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (!rateLimit(`apply:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }, { status: 429 });
    }

    const form = await req.formData();
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const subject = String(form.get("subject") || "");
    const letter = String(form.get("letter") || "");
    const schoolTrack = String(form.get("schoolTrack") || "BOTH");
    const levelPref = String(form.get("levelPref") || "BOTH");
    const schoolFormsRaw = form.get("schoolForms");
    const schoolForms = schoolFormsRaw ? String(schoolFormsRaw) : null;
    const file = form.get("file") as File | null;

    if (!name || !email || !letter) {
      return NextResponse.json(
        { error: "Name, E-Mail und Bewerbungstext sind erforderlich." },
        { status: 400 }
      );
    }

    // ✅ Datei speichern (optional)
    let filePath: string | null = null;
    if (file && file.size > 0) {
      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "Datei zu groß. Maximal 10 MB erlaubt." }, { status: 400 });
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Nur PDF-Dateien erlaubt." }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      // Store outside public/ to prevent unauthenticated access (DSGVO Art. 5, 32)
      const uploadDir = path.join(process.cwd(), "private-uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      filePath = safeName; // store only the filename; served via /api/admin/applications/file
      await fs.writeFile(path.join(uploadDir, safeName), bytes);
    }

    // In DB speichern (upsert: bestehende Bewerbung mit gleicher E-Mail wird aktualisiert)
    await prisma.teacherApplication.upsert({
      where: { email },
      create: { name, email, subject, letter, filePath, schoolTrack, levelPref, schoolForms },
      update: { name, subject, letter, filePath, schoolTrack, levelPref, schoolForms },
    });

    // ✅ Mail-Transport (einmal erstellen, dann 2 Mails schicken)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    // 1) 📧 Mail an Admin
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER, // Admin-Adresse
      subject: "Neue Lehrerbewerbung erhalten",
      html: `
        <h2>Neue Lehrerbewerbung</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>E-Mail:</b> ${email}</p>
        <p><b>Fach:</b> ${subject || "kein Fach angegeben"}</p>
        <p><b>Motivation:</b><br>${letter}</p>
        ${
          filePath
            ? `<p><b>Datei:</b> <a href="${baseUrl}/api/admin/applications/file?name=${encodeURIComponent(filePath)}">PDF ansehen (Admin-Login erforderlich)</a></p>`
            : "<p><b>Datei:</b> keine hochgeladen</p>"
        }
      `,
    });

    // 2) 📧 Bestätigung an den Bewerber
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Deine Bewerbung bei LernApp ist eingegangen",
      html: `
        <h2>Danke für deine Bewerbung, ${name}!</h2>
        <p>Wir haben deine Unterlagen erhalten und melden uns so schnell wie möglich bei dir.</p>
        <p><b>E-Mail:</b> ${email}</p>
        <p><b>Fach:</b> ${subject || "kein Fach angegeben"}</p>
        <p>Viele Grüße,<br/>dein LernApp-Team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logError("app/api/teachers/apply POST", err).catch(() => {});
    console.error("POST /api/teachers/apply error:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Mit dieser E-Mail wurde bereits eine Bewerbung eingereicht." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

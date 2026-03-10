import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import nodemailer from "nodemailer";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.teacherApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }

  const contractPath = path.join(process.cwd(), "contracts", "Werkvertrag\u2013LernEasy_e.U_.pdf");
  const contractPdf = await fs.readFile(contractPath);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: application.email,
    subject: "LernEasy – Dein Werkvertrag zur Unterschrift",
    html: `<h2>Hallo ${application.name}!</h2>
      <p>Wir freuen uns, dir mitteilen zu koennen, dass deine Bewerbung bei LernEasy erfolgreich war!</p>
      <p>Im Anhang findest du deinen Werkvertrag. Bitte unterschreibe ihn und sende ihn zurueck an uns.</p>
      <p>Nach Eingang deines unterschriebenen Vertrags richten wir deinen Lehrer-Account ein und du kannst loslegen.</p>
      <p>Bei Fragen stehen wir dir gerne zur Verfuegung.</p>
      <p>Herzliche Gruesse,<br>Das LernEasy-Team</p>`,
    attachments: [
      {
        filename: "Werkvertrag\u2013LernEasy_e.U_.pdf",
        content: contractPdf,
        contentType: "application/pdf",
      },
    ],
  });

  await prisma.teacherApplication.update({
    where: { id },
    data: { status: "contract_sent" },
  });

  return NextResponse.json({ ok: true });
}

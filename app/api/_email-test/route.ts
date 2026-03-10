import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
      return NextResponse.json(
        { ok: false, error: "SMTP ENV unvollständig" },
        { status: 500 }
      );
    }

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: "hamudi.mario.wiese@gmail.com",
      subject: "LernEasy SMTP Test",
      text: "Hallo! Diese Mail bestätigt, dass SMTP aus deiner App funktioniert.",
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

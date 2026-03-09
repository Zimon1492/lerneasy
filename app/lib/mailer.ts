import nodemailer from "nodemailer";

export function getMailer() {
  if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST fehlt");
  if (!process.env.SMTP_PORT) throw new Error("SMTP_PORT fehlt");
  if (!process.env.SMTP_USER) throw new Error("SMTP_USER fehlt");
  if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS fehlt");

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendBookingAcceptedEmail({
  to,
  teacherName,
  startISO,
  endISO,
}: {
  to: string;
  teacherName?: string;
  startISO: string;
  endISO: string;
}) {
  const transporter = getMailer();

  const start = new Date(startISO);
  const end = new Date(endISO);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "✅ Termin bestätigt",
    text: `Dein Termin bei ${teacherName ?? "dem Lehrer"} wurde bestätigt.
Datum: ${start.toLocaleDateString("de-DE")}
Zeit: ${start.toLocaleTimeString("de-DE")} – ${end.toLocaleTimeString("de-DE")}
`,
  });
}

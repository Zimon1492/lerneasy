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

// ─── Gemeinsame Hilfsfunktionen ─────────────────────────────────────────────

function fmtEur(cents: number, currency = "eur") {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function durationText(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} Std.${m > 0 ? ` ${m} Min.` : ""}` : `${m} Min.`;
}

const HEADER = (issuerName: string, issuerAddress: string, issuerUid: string | null) => `
  <div style="background:#1e3a5f;padding:20px 28px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${issuerName}</div>
      <div style="color:#a8c7f0;font-size:12px;margin-top:4px;white-space:pre-line;">${issuerAddress}</div>
      ${issuerUid ? `<div style="color:#a8c7f0;font-size:12px;">UID: ${issuerUid}</div>` : ""}
    </div>
  </div>`;

const FOOTER = (issuerName: string) => `
  <div style="background:#f8fafc;padding:14px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;text-align:center;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">${issuerName} · Dieses Dokument wurde automatisch erstellt.</p>
  </div>`;

// ─── 1) Zahlungsbeleg (Kleinbetragsrechnung § 11 Abs. 6 UStG) → an Schüler ──

export async function sendZahlungsbeleg(inv: {
  to: string;
  invoiceNumber: string;
  issuerName: string;
  issuerAddress: string;
  issuerUid: string | null;
  teacherName: string;
  subject: string | null;
  serviceDate: Date;
  serviceStartTime: string;
  serviceEndTime: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  issuedAt: Date;
}) {
  const transporter = getMailer();
  const from = process.env.FROM_EMAIL ?? process.env.MAIL_FROM;

  const taxNote = process.env.COMPANY_TAX_NOTE
    ?? "Gemäß § 6 Abs. 1 Z 27 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer in Rechnung gestellt.";

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Zahlungsbeleg ${inv.invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  ${HEADER(inv.issuerName, inv.issuerAddress, inv.issuerUid)}

  <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;">
    <table style="width:100%;font-size:13px;margin-bottom:20px;">
      <tr>
        <td style="color:#64748b;padding:3px 0;width:50%;">Belegnummer:</td>
        <td style="font-weight:700;padding:3px 0;">${inv.invoiceNumber}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Ausstellungsdatum:</td>
        <td style="padding:3px 0;">${inv.issuedAt.toLocaleDateString("de-AT")}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Zahlungsstatus:</td>
        <td style="padding:3px 0;color:#16a34a;font-weight:600;">✓ Bezahlt</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;">

    <h3 style="font-size:14px;color:#1e3a5f;margin:0 0 12px;">Leistungsübersicht</h3>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">Leistung</th>
          <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">Betrag</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 10px;vertical-align:top;">
            <div style="font-weight:600;">Nachhilfestunde${inv.subject ? ` – ${inv.subject}` : ""}</div>
            <div style="color:#64748b;font-size:12px;margin-top:4px;">Lehrer/in: ${inv.teacherName}</div>
            <div style="color:#64748b;font-size:12px;">
              ${inv.serviceDate.toLocaleDateString("de-AT")},
              ${inv.serviceStartTime} – ${inv.serviceEndTime}
              (${durationText(inv.durationMinutes)})
            </div>
          </td>
          <td style="padding:12px 10px;text-align:right;font-weight:600;vertical-align:top;">
            ${fmtEur(inv.priceCents, inv.currency)}
          </td>
        </tr>
      </tbody>
    </table>

    <table style="width:100%;font-size:13px;margin-top:16px;">
      <tr style="font-weight:700;font-size:14px;border-top:2px solid #1e3a5f;">
        <td style="text-align:right;padding:10px 10px 4px;">Gesamtbetrag (inkl. aller Abgaben):</td>
        <td style="text-align:right;padding:10px 10px 4px;width:130px;">${fmtEur(inv.priceCents, inv.currency)}</td>
      </tr>
    </table>

    <p style="font-size:11px;color:#94a3b8;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:14px;line-height:1.5;">
      ${taxNote}<br>
      Kleinbetragsrechnung gemäß § 11 Abs. 6 UStG.
    </p>
  </div>
  ${FOOTER(inv.issuerName)}
</body>
</html>`;

  await transporter.sendMail({
    from,
    to: inv.to,
    subject: `Ihr Zahlungsbeleg ${inv.invoiceNumber} – ${inv.issuerName}`,
    html,
    text: `Zahlungsbeleg ${inv.invoiceNumber}\nAusgestellt: ${inv.issuedAt.toLocaleDateString("de-AT")}\nStatus: Bezahlt\n\nLeistung: Nachhilfestunde${inv.subject ? ` (${inv.subject})` : ""} bei ${inv.teacherName}\nDatum: ${inv.serviceDate.toLocaleDateString("de-AT")}, ${inv.serviceStartTime}–${inv.serviceEndTime}\nDauer: ${durationText(inv.durationMinutes)}\nBetrag: ${fmtEur(inv.priceCents, inv.currency)}\n\n${taxNote}`,
  });
}

// ─── 2) Gutschrift (§ 11 Abs. 8 UStG, Provisionsabrechnung) → an Lehrer ─────

export async function sendGutschrift(inv: {
  to: string;
  invoiceNumber: string;
  issuerName: string;
  issuerAddress: string;
  issuerUid: string | null;
  teacherName: string;
  teacherAddress: string | null;
  teacherTaxNumber: string | null;
  subject: string | null;
  serviceDate: Date;
  serviceStartTime: string;
  serviceEndTime: string;
  durationMinutes: number;
  priceCents: number;
  commissionCents: number;
  teacherNetCents: number;
  teacherSharePct: number;
  currency: string;
  issuedAt: Date;
}) {
  const transporter = getMailer();
  const from = process.env.FROM_EMAIL ?? process.env.MAIL_FROM;
  const commissionPct = Math.round((1 - inv.teacherSharePct) * 100);

  const taxNote = process.env.COMPANY_TAX_NOTE
    ?? "Gemäß § 6 Abs. 1 Z 27 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer in Rechnung gestellt.";

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Gutschrift ${inv.invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  ${HEADER(inv.issuerName, inv.issuerAddress, inv.issuerUid)}

  <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;">
    <div style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:16px;letter-spacing:0.05em;">
      GUTSCHRIFT gemäß § 11 Abs. 8 UStG
    </div>

    <table style="width:100%;font-size:13px;margin-bottom:20px;">
      <tr>
        <td style="color:#64748b;padding:3px 0;width:50%;">Gutschrift-Nummer:</td>
        <td style="font-weight:700;padding:3px 0;">${inv.invoiceNumber}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Ausstellungsdatum:</td>
        <td style="padding:3px 0;">${inv.issuedAt.toLocaleDateString("de-AT")}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:3px 0;">Leistungserbringer:</td>
        <td style="padding:3px 0;">${inv.teacherName}${inv.teacherAddress ? `<br><span style="color:#94a3b8;font-size:12px;">${inv.teacherAddress}</span>` : ""}</td>
      </tr>
      ${inv.teacherTaxNumber ? `<tr>
        <td style="color:#64748b;padding:3px 0;">UID/Steuernummer:</td>
        <td style="padding:3px 0;">${inv.teacherTaxNumber}</td>
      </tr>` : ""}
    </table>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;">

    <h3 style="font-size:14px;color:#1e3a5f;margin:0 0 12px;">Abrechnung</h3>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">Leistung</th>
          <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">Einnahme</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 10px;vertical-align:top;">
            <div style="font-weight:600;">Nachhilfestunde${inv.subject ? ` – ${inv.subject}` : ""}</div>
            <div style="color:#64748b;font-size:12px;margin-top:4px;">
              ${inv.serviceDate.toLocaleDateString("de-AT")},
              ${inv.serviceStartTime} – ${inv.serviceEndTime}
              (${durationText(inv.durationMinutes)})
            </div>
          </td>
          <td style="padding:12px 10px;text-align:right;font-weight:600;vertical-align:top;">
            ${fmtEur(inv.priceCents, inv.currency)}
          </td>
        </tr>
      </tbody>
    </table>

    <table style="width:100%;font-size:13px;margin-top:16px;">
      <tr>
        <td style="text-align:right;color:#64748b;padding:4px 10px;">Brutto-Einnahme:</td>
        <td style="text-align:right;padding:4px 10px;width:140px;">${fmtEur(inv.priceCents, inv.currency)}</td>
      </tr>
      <tr>
        <td style="text-align:right;color:#e11d48;padding:4px 10px;">Plattformprovision (${commissionPct}%):</td>
        <td style="text-align:right;padding:4px 10px;color:#e11d48;">− ${fmtEur(inv.commissionCents, inv.currency)}</td>
      </tr>
      <tr style="font-weight:700;font-size:15px;border-top:2px solid #1e3a5f;">
        <td style="text-align:right;padding:10px 10px 4px;color:#16a34a;">Ihr Auszahlungsbetrag:</td>
        <td style="text-align:right;padding:10px 10px 4px;color:#16a34a;">${fmtEur(inv.teacherNetCents, inv.currency)}</td>
      </tr>
    </table>

    <p style="font-size:11px;color:#94a3b8;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:14px;line-height:1.5;">
      ${taxNote}<br>
      Diese Gutschrift gilt als Rechnung im Sinne von § 11 Abs. 8 UStG.<br>
      Der Leistungserbringer ist damit einverstanden, dass ${inv.issuerName} diese Gutschrift ausstellt.
    </p>
  </div>
  ${FOOTER(inv.issuerName)}
</body>
</html>`;

  await transporter.sendMail({
    from,
    to: inv.to,
    subject: `Ihre Gutschrift ${inv.invoiceNumber} – ${inv.issuerName}`,
    html,
    text: `Gutschrift ${inv.invoiceNumber} (§ 11 Abs. 8 UStG)\nAusgestellt: ${inv.issuedAt.toLocaleDateString("de-AT")}\n\nLeistung: Nachhilfestunde${inv.subject ? ` (${inv.subject})` : ""}\nDatum: ${inv.serviceDate.toLocaleDateString("de-AT")}, ${inv.serviceStartTime}–${inv.serviceEndTime}\n\nBrutto-Einnahme: ${fmtEur(inv.priceCents, inv.currency)}\nProvision (${commissionPct}%): - ${fmtEur(inv.commissionCents, inv.currency)}\nIhr Auszahlungsbetrag: ${fmtEur(inv.teacherNetCents, inv.currency)}\n\n${taxNote}`,
  });
}

// ─── Buchungsbestätigung ─────────────────────────────────────────────────────

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

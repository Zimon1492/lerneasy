import prisma from "@/app/lib/prisma";

export const MAX_BOOKING_PRICE_CENTS = 40_000; // €400 Limit (Kleinbetragsrechnung)

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function toTimeString(date: Date): string {
  return date.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function getIssuerData() {
  return {
    issuerName:    process.env.COMPANY_NAME    ?? "LernEasy",
    issuerAddress: process.env.COMPANY_ADDRESS ?? "Adresse nicht konfiguriert – bitte COMPANY_ADDRESS in .env setzen",
    issuerUid:     process.env.COMPANY_UID     ?? null,
  };
}

async function nextInvoiceNumber(prefix: "RE" | "GA"): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: `${prefix}-${year}` } } });
  const seq   = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

/**
 * Erstellt beide Dokumente für eine bezahlte Buchung (idempotent):
 *  1. Zahlungsbeleg (Kleinbetragsrechnung § 11 Abs. 6 UStG) → für Schüler
 *  2. Gutschrift (§ 11 Abs. 8 UStG, Provisionsabrechnung)   → für Lehrer
 *
 * Gibt beide zurück, egal ob sie gerade neu erstellt oder schon vorhanden waren.
 */
export async function createInvoicesForBooking(bookingId: string) {
  // Idempotenz: prüfen ob schon beide vorhanden
  const existing = await prisma.invoice.findMany({ where: { bookingId } });
  const existingZahlungsbeleg    = existing.find((i) => i.type === "zahlungsbeleg");
  const existingGutschrift       = existing.find((i) => i.type === "gutschrift");
  if (existingZahlungsbeleg && existingGutschrift) {
    return { zahlungsbeleg: existingZahlungsbeleg, gutschrift: existingGutschrift };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      teacher: true,
      availability: { include: { offer: { include: { subject: true } } } },
    },
  });
  if (!booking) throw new Error(`Buchung ${bookingId} nicht gefunden`);

  const startDate = new Date(booking.start);
  const endDate   = new Date(booking.end);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
  const subject = booking.availability?.offer?.subject?.name ?? booking.teacher.subject ?? null;

  const issuer = getIssuerData();

  // Plattform-Share aus PlatformSettings
  const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const teacherShare = settings?.teacherShare ?? 0.70;
  const teacherNetCents    = Math.round(booking.priceCents * teacherShare);
  const commissionCents    = booking.priceCents - teacherNetCents;

  const [zahlungsbeleg, gutschrift] = await Promise.all([
    // 1) Zahlungsbeleg für Schüler (falls noch nicht vorhanden)
    existingZahlungsbeleg
      ? Promise.resolve(existingZahlungsbeleg)
      : prisma.invoice.create({
          data: {
            invoiceNumber:   await nextInvoiceNumber("RE"),
            bookingId:       booking.id,
            type:            "zahlungsbeleg",
            ...issuer,
            studentName:     booking.student.name ?? booking.student.email,
            studentEmail:    booking.student.email,
            teacherName:     booking.teacher.name,
            teacherEmail:    booking.teacher.email,
            teacherAddress:  booking.teacher.address ?? null,
            teacherTaxNumber: booking.teacher.taxNumber ?? null,
            subject,
            serviceDate:     startDate,
            serviceStartTime: toTimeString(startDate),
            serviceEndTime:   toTimeString(endDate),
            durationMinutes,
            priceCents:      booking.priceCents,
            currency:        booking.currency,
            taxRatePct:      0,
          },
        }),

    // 2) Gutschrift für Lehrer (falls noch nicht vorhanden)
    existingGutschrift
      ? Promise.resolve(existingGutschrift)
      : prisma.invoice.create({
          data: {
            invoiceNumber:   await nextInvoiceNumber("GA"),
            bookingId:       booking.id,
            type:            "gutschrift",
            ...issuer,
            studentName:     booking.student.name ?? booking.student.email,
            studentEmail:    booking.student.email,
            teacherName:     booking.teacher.name,
            teacherEmail:    booking.teacher.email,
            teacherAddress:  booking.teacher.address ?? null,
            teacherTaxNumber: booking.teacher.taxNumber ?? null,
            subject,
            serviceDate:     startDate,
            serviceStartTime: toTimeString(startDate),
            serviceEndTime:   toTimeString(endDate),
            durationMinutes,
            priceCents:      booking.priceCents,
            currency:        booking.currency,
            taxRatePct:      0,
            commissionCents,
            teacherNetCents,
            teacherSharePct: teacherShare,
          },
        }),
  ]);

  return { zahlungsbeleg, gutschrift };
}

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

async function nextInvoiceNumber(prefix: "RE" | "GA" | "ST"): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: `${prefix}-${year}` } } });
  const seq   = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

async function fetchBookingWithRelations(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      teacher: true,
      availability: { include: { offer: { include: { subject: true } } } },
    },
  });
  if (!booking) throw new Error(`Buchung ${bookingId} nicht gefunden`);
  return booking;
}

/**
 * Erstellt den Zahlungsbeleg (Schüler-Quittung) für eine bezahlte Buchung — idempotent.
 */
export async function createZahlungsbeleg(bookingId: string, stripeFeeCents?: number | null) {
  const existing = await prisma.invoice.findFirst({ where: { bookingId, type: "zahlungsbeleg" } });
  if (existing) return existing;

  const booking = await fetchBookingWithRelations(bookingId);
  const startDate = new Date(booking.start);
  const endDate   = new Date(booking.end);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
  const subject = booking.availability?.offer?.subject?.name ?? booking.teacher.subject ?? null;
  const issuer  = getIssuerData();

  return prisma.invoice.create({
    data: {
      invoiceNumber:    await nextInvoiceNumber("RE"),
      bookingId:        booking.id,
      type:             "zahlungsbeleg",
      ...issuer,
      studentName:      booking.student.name ?? booking.student.email,
      studentEmail:     booking.student.email,
      teacherName:      booking.teacher.name,
      teacherEmail:     booking.teacher.email,
      teacherAddress:   booking.teacher.address ?? null,
      teacherTaxNumber: booking.teacher.taxNumber ?? null,
      subject,
      serviceDate:      startDate,
      serviceStartTime: toTimeString(startDate),
      serviceEndTime:   toTimeString(endDate),
      durationMinutes,
      priceCents:       booking.priceCents,
      currency:         booking.currency,
      taxRatePct:       0,
      stripeFeeCents:   stripeFeeCents ?? null,
    },
  });
}

/**
 * Erstellt einen Stornobeleg wenn ein Lehrer eine bezahlte Buchung storniert — idempotent.
 * Dokumentiert die Rückerstattung inkl. Stripe-Refund-ID für die Buchhaltung.
 */
export async function createStornobeleg(bookingId: string, stripeRefundId: string | null) {
  const existing = await prisma.invoice.findFirst({ where: { bookingId, type: "stornobeleg" } });
  if (existing) return existing;

  const booking = await fetchBookingWithRelations(bookingId);

  // Stripe-Gebühr vom Zahlungsbeleg übernehmen — sie wird bei Refund NICHT zurückerstattet
  const zahlungsbeleg = await prisma.invoice.findFirst({ where: { bookingId, type: "zahlungsbeleg" } });
  const stripeFeeCents = zahlungsbeleg?.stripeFeeCents ?? null;
  const startDate = new Date(booking.start);
  const endDate   = new Date(booking.end);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
  const subject = booking.availability?.offer?.subject?.name ?? booking.teacher.subject ?? null;
  const issuer  = getIssuerData();

  return prisma.invoice.create({
    data: {
      invoiceNumber:    await nextInvoiceNumber("ST"),
      bookingId:        booking.id,
      type:             "stornobeleg",
      ...issuer,
      studentName:      booking.student.name ?? booking.student.email,
      studentEmail:     booking.student.email,
      teacherName:      booking.teacher.name,
      teacherEmail:     booking.teacher.email,
      teacherAddress:   booking.teacher.address ?? null,
      teacherTaxNumber: booking.teacher.taxNumber ?? null,
      subject,
      serviceDate:      startDate,
      serviceStartTime: toTimeString(startDate),
      serviceEndTime:   toTimeString(endDate),
      durationMinutes,
      priceCents:       booking.priceCents,
      currency:         booking.currency,
      taxRatePct:       0,
      stripeRefundId,
      stripeFeeCents,
    },
  });
}

/**
 * Erstellt die Gutschrift (Lehrer-Provisionsabrechnung) für eine abgeschlossene Buchung — idempotent.
 * Wird beim Auszahlen aufgerufen, nicht bei Buchungszahlung.
 */
export async function createGutschrift(bookingId: string) {
  const existing = await prisma.invoice.findFirst({ where: { bookingId, type: "gutschrift" } });
  if (existing) return existing;

  const booking = await fetchBookingWithRelations(bookingId);
  const startDate = new Date(booking.start);
  const endDate   = new Date(booking.end);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
  const subject = booking.availability?.offer?.subject?.name ?? booking.teacher.subject ?? null;
  const issuer  = getIssuerData();

  const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const teacherShare    = settings?.teacherShare ?? 0.70;
  const teacherNetCents = Math.round(booking.priceCents * teacherShare);
  const commissionCents = booking.priceCents - teacherNetCents;

  return prisma.invoice.create({
    data: {
      invoiceNumber:    await nextInvoiceNumber("GA"),
      bookingId:        booking.id,
      type:             "gutschrift",
      ...issuer,
      studentName:      booking.student.name ?? booking.student.email,
      studentEmail:     booking.student.email,
      teacherName:      booking.teacher.name,
      teacherEmail:     booking.teacher.email,
      teacherAddress:   booking.teacher.address ?? null,
      teacherTaxNumber: booking.teacher.taxNumber ?? null,
      subject,
      serviceDate:      startDate,
      serviceStartTime: toTimeString(startDate),
      serviceEndTime:   toTimeString(endDate),
      durationMinutes,
      priceCents:       booking.priceCents,
      currency:         booking.currency,
      taxRatePct:       0,
      commissionCents,
      teacherNetCents,
      teacherSharePct:  teacherShare,
    },
  });
}

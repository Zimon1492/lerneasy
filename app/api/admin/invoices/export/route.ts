import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { isAdminAuthed } from "@/app/api/admin/_auth";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({ orderBy: { issuedAt: "desc" } });

  const zahlungsbelege = invoices.filter((i) => i.type === "zahlungsbeleg");
  const gutschriften   = invoices.filter((i) => i.type === "gutschrift");
  const stornobelege   = invoices.filter((i) => i.type === "stornobeleg");

  // ─── Sheet 1: Zahlungsbelege (für Schüler) ────────────────────────────────
  const rowsZ = zahlungsbelege.map((inv) => ({
    "Belegnummer":       inv.invoiceNumber,
    "Ausstellungsdatum": new Date(inv.issuedAt).toLocaleDateString("de-AT"),
    "Schüler Name":      inv.studentName,
    "Schüler E-Mail":    inv.studentEmail,
    "Lehrer Name":       inv.teacherName,
    "Fach":              inv.subject ?? "",
    "Leistungsdatum":    new Date(inv.serviceDate).toLocaleDateString("de-AT"),
    "Uhrzeit von":       inv.serviceStartTime,
    "Uhrzeit bis":       inv.serviceEndTime,
    "Dauer (Min)":       inv.durationMinutes,
    "Betrag (EUR)":           (inv.priceCents / 100).toFixed(2),
    "Stripe-Gebühr (EUR)":   inv.stripeFeeCents != null ? (inv.stripeFeeCents / 100).toFixed(2) : "",
    "Netto-Einnahme (EUR)":  inv.stripeFeeCents != null ? ((inv.priceCents - inv.stripeFeeCents) / 100).toFixed(2) : "",
    "USt. %":                inv.taxRatePct,
    "Buchungs-ID":           inv.bookingId,
  }));

  // ─── Sheet 2: Gutschriften (Provisionsabrechnungen für Lehrer) ────────────
  const rowsG = gutschriften.map((inv) => ({
    "Gutschrift-Nr.":       inv.invoiceNumber,
    "Ausstellungsdatum":    new Date(inv.issuedAt).toLocaleDateString("de-AT"),
    "Lehrer Name":          inv.teacherName,
    "Lehrer E-Mail":        inv.teacherEmail,
    "Lehrer Adresse":       inv.teacherAddress ?? "",
    "Lehrer UID/StNr.":     inv.teacherTaxNumber ?? "",
    "Fach":                 inv.subject ?? "",
    "Leistungsdatum":       new Date(inv.serviceDate).toLocaleDateString("de-AT"),
    "Uhrzeit von":          inv.serviceStartTime,
    "Uhrzeit bis":          inv.serviceEndTime,
    "Dauer (Min)":          inv.durationMinutes,
    "Brutto-Einnahme (EUR)":       (inv.priceCents / 100).toFixed(2),
    "Provision (EUR)":      ((inv.commissionCents ?? 0) / 100).toFixed(2),
    "Auszahlung Lehrer (EUR)":     ((inv.teacherNetCents ?? 0) / 100).toFixed(2),
    "Lehrer-Anteil %":      inv.teacherSharePct != null ? Math.round(inv.teacherSharePct * 100) : "",
    "USt. %":               inv.taxRatePct,
    "Buchungs-ID":          inv.bookingId,
  }));

  // ─── Sheet 3: Stornobelege (stornierte & rückerstattete Buchungen) ───────────
  const rowsS = stornobelege.map((inv) => ({
    "Stornobeleg-Nr.":    inv.invoiceNumber,
    "Ausstellungsdatum":  new Date(inv.issuedAt).toLocaleDateString("de-AT"),
    "Schüler Name":       inv.studentName,
    "Schüler E-Mail":     inv.studentEmail,
    "Lehrer Name":        inv.teacherName,
    "Lehrer E-Mail":      inv.teacherEmail,
    "Fach":               inv.subject ?? "",
    "Stornierter Termin": new Date(inv.serviceDate).toLocaleDateString("de-AT"),
    "Uhrzeit von":        inv.serviceStartTime,
    "Uhrzeit bis":        inv.serviceEndTime,
    "Rückerstattung (EUR)":          (inv.priceCents / 100).toFixed(2),
    "Stripe-Gebühr (Verlust, EUR)":  inv.stripeFeeCents != null ? (inv.stripeFeeCents / 100).toFixed(2) : "",
    "Stripe Refund-ID":              inv.stripeRefundId ?? "",
    "Buchungs-ID":                   inv.bookingId,
  }));

  const wsZ = XLSX.utils.json_to_sheet(rowsZ.length > 0 ? rowsZ : [{}]);
  const wsG = XLSX.utils.json_to_sheet(rowsG.length > 0 ? rowsG : [{}]);
  const wsS = XLSX.utils.json_to_sheet(rowsS.length > 0 ? rowsS : [{}]);

  wsZ["!cols"] = [
    { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 22 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 8  }, { wch: 38 },
  ];
  wsG["!cols"] = [
    { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 28 },
    { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 14 },
    { wch: 8  }, { wch: 38 },
  ];
  wsS["!cols"] = [
    { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 22 },
    { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
    { wch: 22 }, { wch: 26 }, { wch: 32 }, { wch: 38 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsZ, "Zahlungsbelege (Schüler)");
  XLSX.utils.book_append_sheet(wb, wsG, "Gutschriften (Lehrer)");
  XLSX.utils.book_append_sheet(wb, wsS, "Stornobelege");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lerneasy-belege-${dateStr}.xlsx"`,
    },
  });
}

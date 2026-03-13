// app/teacher/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type StudentInfo = {
  id: string;
  name: string | null;
  email: string;
  schoolName: string | null;
  schoolTrack: "AHS" | "BHS" | null;
  schoolForm: string | null; // enum string
  level: "UNTERSTUFE" | "OBERSTUFE" | null;
  grade: number | null;
};

type Booking = {
  id: string;
  start: string;
  end: string;
  status: string;
  note?: string | null;
  student?: StudentInfo | null;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelLevel(level: StudentInfo["level"]) {
  if (!level) return "—";
  return level === "UNTERSTUFE" ? "Unterstufe" : "Oberstufe";
}

function labelTrack(track: StudentInfo["schoolTrack"]) {
  if (!track) return "—";
  return track;
}

const LABEL_FORM: Record<string, string> = {
  ALL: "Alle",
  AHS_GYMNASIUM: "Gymnasium / Klassisches Gymnasium",
  AHS_REALGYMNASIUM: "Realgymnasium",
  AHS_WK_REALGYMNASIUM: "Wirtschaftskundliches Realgymnasium",
  AHS_BORG: "BORG (Oberstufenrealgymnasium)",
  AHS_SCHWERPUNKT: "AHS mit Schwerpunkt",
  BHS_HTL: "HTL",
  BHS_HAK: "HAK",
  BHS_HLW: "HLW / HWS",
  BHS_MODE: "HLA Mode",
  BHS_KUNST_GESTALTUNG: "HLA Kunst & Gestaltung",
  BHS_TOURISMUS: "HLA Tourismus",
  BHS_SOZIALPAED: "Sozial-/Elementarpädagogik",
  BHS_LAND_FORST: "Land- & Forstwirtschaft",
};

function labelForm(form: string | null) {
  if (!form) return "—";
  return LABEL_FORM[form] || form;
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // BUCHUNGEN LADEN
  // ------------------------------------------------------------------
  async function loadBookings() {
    if (!session?.user?.email) return;

    setLoading(true);
    const res = await fetch(`/api/bookings/teacher?email=${session.user.email}`, {
      cache: "no-store",
    });

    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "authenticated") loadBookings();
  }, [status]);

  // ------------------------------------------------------------------
  // TERMIN ANNEHMEN (Karte wird belastet)
  // ------------------------------------------------------------------
  async function acceptBooking(bookingId: string) {
    const res = await fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("Fehler: " + (data?.error || res.status));
    }
    loadBookings();
  }

  // ------------------------------------------------------------------
  // TERMIN ABLEHNEN (Karte wird gelöscht, Schüler wird informiert)
  // ------------------------------------------------------------------
  async function cancelPaidBooking(bookingId: string) {
    if (!confirm("Bezahlte Stunde stornieren? Der Betrag wird automatisch zurückerstattet.")) return;
    const res = await fetch(`/api/teacher/bookings/${bookingId}/cancel`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("Fehler: " + (data?.error || res.status));
    }
    loadBookings();
  }

  async function declineBooking(bookingId: string) {
    const res = await fetch("/api/bookings/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("Fehler: " + (data?.error || res.status));
    }
    loadBookings();
  }

  // ------------------------------------------------------------------
  // EVENTS FÜR FULLCALENDAR
  // ------------------------------------------------------------------
  function statusLabel(status: string) {
    switch (status) {
      case "payment_method_saved": return "offen";
      case "paid": return "angenommen";
      case "declined": return "abgelehnt";
      case "canceled_by_system": return "storniert";
      case "payment_failed": return "Zahlung fehlgeschlagen";
      case "pending":
      case "checkout_started": return "ausstehend";
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "payment_method_saved": return "#3b82f6"; // blau – Aktion nötig
      case "paid": return "#16a34a";                 // grün
      case "declined":
      case "payment_failed": return "#dc2626";       // rot
      default: return "#9ca3af";                     // grau
    }
  }

  const events = bookings.map((b) => ({
    id: b.id,
    title: (b.student?.name || b.student?.email || "Termin") + ` (${statusLabel(b.status)})`,
    start: b.start,
    end: b.end,
    backgroundColor: statusColor(b.status),
  }));

  // ------------------------------------------------------------------
  // TERMIN KLICK
  // ------------------------------------------------------------------
  function onEventClick(info: any) {
    const booking = bookings.find((b) => b.id === info.event.id);
    if (!booking) return;

    const student = booking.student || null;

    const noteText = booking.note?.trim()
      ? escapeHtml(booking.note.trim())
      : "—";

    const studentName = escapeHtml(student?.name || "—");
    const studentEmail = escapeHtml(student?.email || "—");
    const schoolName = escapeHtml(student?.schoolName || "—");
    const schoolTrack = escapeHtml(labelTrack(student?.schoolTrack || null));
    const schoolForm = escapeHtml(labelForm(student?.schoolForm || null));
    const schoolLevel = escapeHtml(labelLevel(student?.level || null));
    const grade = student?.grade ? String(student.grade) : "—";

    const dialog = document.createElement("div");
    dialog.className =
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";

    const canAct = booking.status === "payment_method_saved";
    const canCancelPaid = booking.status === "paid";

    dialog.innerHTML = `
      <div class="bg-white p-6 rounded-xl max-w-md w-full">
        <h2 class="text-xl font-bold mb-3">Termin verwalten</h2>

        <div style="margin-bottom:10px;">
          <p><strong>Schüler:</strong> ${studentName}</p>
          <p><strong>E-Mail:</strong> ${studentEmail}</p>
          <p><strong>Schule:</strong> ${schoolName}</p>
          <p><strong>Schultyp:</strong> ${schoolTrack}</p>
          <p><strong>Schulform:</strong> ${schoolForm}</p>
          <p><strong>Stufe:</strong> ${schoolLevel}</p>
          <p><strong>Klasse:</strong> ${escapeHtml(grade)}</p>
        </div>

        <p><strong>Datum:</strong> ${new Date(booking.start).toLocaleDateString("de-AT", { timeZone: "UTC" })}</p>
        <p><strong>Zeit:</strong> ${new Date(booking.start).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} – ${new Date(booking.end).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}</p>

        <div style="margin-top:12px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
          <p style="font-weight:700; margin-bottom:6px;">Notiz des Schülers:</p>
          <p style="white-space:pre-wrap;">${noteText}</p>
        </div>

        ${canAct ? `
        <div class="flex gap-3 mt-6">
          <button id="acceptBtn" class="flex-1 bg-green-600 text-white py-2 rounded-lg">
            Annehmen &amp; Zahlung abbuchen
          </button>
          <button id="declineBtn" class="flex-1 bg-red-600 text-white py-2 rounded-lg">
            Ablehnen
          </button>
        </div>
        ` : canCancelPaid ? `
        <div style="margin-top:16px;">
          <button id="cancelPaidBtn" style="width:100%;padding:10px;background:#dc2626;color:white;border-radius:8px;font-weight:600;">
            Stornieren &amp; Rückerstattung
          </button>
          <p style="margin-top:6px;font-size:12px;color:#64748b;text-align:center;">Der gezahlte Betrag wird dem Schüler vollständig zurückerstattet.</p>
        </div>
        ` : `
        <div style="margin-top:16px; padding:10px; background:#f1f5f9; border-radius:8px; text-align:center; color:#64748b;">
          Status: ${escapeHtml(statusLabel(booking.status))}
        </div>
        `}

        <button id="closeBtn" class="mt-4 w-full py-2 text-gray-600">
          Schließen
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    if (canAct) {
      (dialog.querySelector("#acceptBtn") as HTMLElement).onclick = async () => {
        await acceptBooking(booking.id);
        dialog.remove();
      };

      (dialog.querySelector("#declineBtn") as HTMLElement).onclick = async () => {
        await declineBooking(booking.id);
        dialog.remove();
      };
    }

    if (canCancelPaid) {
      (dialog.querySelector("#cancelPaidBtn") as HTMLElement).onclick = async () => {
        dialog.remove();
        await cancelPaidBooking(booking.id);
      };
    }

    (dialog.querySelector("#closeBtn") as HTMLElement).onclick = () => dialog.remove();
  }

  // ------------------------------------------------------------------

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <main className="min-h-screen bg-gray-50 px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl font-bold mb-4">Mein Kalender</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
        headerToolbar={isMobile ? {
          left: "prev,next",
          center: "title",
          right: "timeGridDay,dayGridMonth",
        } : {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        timeZone="Europe/Vienna"
        events={events}
        eventClick={onEventClick}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        nowIndicator
        height="auto"
      />
    </main>
  );
}

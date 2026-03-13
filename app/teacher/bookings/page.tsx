"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Student = {
  id: string;
  name: string | null;
  email: string;
  schoolName: string | null;
  schoolTrack: string | null;
  schoolForm: string | null;
  level: string | null;
  grade: number | null;
};

type Booking = {
  id: string;
  start: string;
  end: string;
  status: string;
  note: string | null;
  priceCents: number;
  student: Student | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  checkout_started: "Zahlung gestartet",
  payment_method_saved: "Warten auf Bestätigung",
  paid: "Bezahlt / Angenommen",
  declined: "Abgelehnt",
  payment_failed: "Zahlung fehlgeschlagen",
  canceled_by_system: "Storniert",
  teacher_cancelled: "Von dir storniert",
  student_cancelled: "Vom Schüler storniert",
};

const STATUS_COLOR: Record<string, string> = {
  payment_method_saved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  payment_failed: "bg-red-100 text-red-800",
  canceled_by_system: "bg-gray-100 text-gray-500",
  teacher_cancelled: "bg-orange-100 text-orange-700",
  student_cancelled: "bg-gray-100 text-gray-500",
  pending: "bg-gray-100 text-gray-600",
  checkout_started: "bg-yellow-100 text-yellow-800",
};

export default function TeacherBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    if (!session?.user?.email) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/teacher?email=${encodeURIComponent(session.user.email)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (session?.user?.email) load();
  }, [session]);

  async function accept(bookingId: string) {
    setActionLoading(bookingId);
    const res = await fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert("Fehler: " + (d?.error || res.status));
    }
    setActionLoading(null);
    load();
  }

  async function decline(bookingId: string) {
    setActionLoading(bookingId);
    const res = await fetch("/api/bookings/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert("Fehler: " + (d?.error || res.status));
    }
    setActionLoading(null);
    load();
  }

  async function cancel(bookingId: string, priceCents: number) {
    const confirmed = window.confirm(
      `Buchung wirklich stornieren? Der Schüler erhält ${(priceCents / 100).toFixed(2)} € zurück.`
    );
    if (!confirmed) return;
    setActionLoading(bookingId);
    const res = await fetch(`/api/teacher/bookings/${bookingId}/cancel`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert("Fehler: " + (d?.error || res.status));
    }
    setActionLoading(null);
    load();
  }

  const pending = bookings.filter((b) => b.status === "payment_method_saved");
  const rest = bookings.filter((b) => b.status !== "payment_method_saved");

  if (loading) {
    return <p className="text-gray-500 py-10 text-center">Lade Buchungen…</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-gray-500 py-10 text-center">Noch keine Buchungen vorhanden.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Alle Buchungen</h1>

      {/* Pending — need action */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-blue-700 mb-3">
            Warten auf deine Bestätigung ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                actionLoading={actionLoading}
                onAccept={accept}
                onDecline={decline}
                onCancel={cancel}
              />
            ))}
          </div>
        </section>
      )}

      {/* All other bookings */}
      {rest.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-600 mb-3">Weitere Buchungen</h2>
          <div className="space-y-3">
            {rest.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                actionLoading={actionLoading}
                onAccept={accept}
                onDecline={decline}
                onCancel={cancel}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function canCancel(booking: Booking): boolean {
  if (booking.status !== "paid") return false;
  const oneDayBeforeStart = new Date(booking.start).getTime() - 24 * 60 * 60 * 1000;
  return Date.now() < oneDayBeforeStart;
}

function BookingCard({
  booking: b,
  actionLoading,
  onAccept,
  onDecline,
  onCancel,
}: {
  booking: Booking;
  actionLoading: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string, priceCents: number) => void;
}) {
  const isPending = b.status === "payment_method_saved";
  const isActing = actionLoading === b.id;
  const cancellable = canCancel(b);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Student info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {b.student?.name || b.student?.email || "Unbekannt"}
        </p>
        <p className="text-sm text-gray-500 truncate">{b.student?.email}</p>
        {b.student?.schoolName && (
          <p className="text-xs text-gray-400 mt-0.5">{b.student.schoolName}</p>
        )}
      </div>

      {/* Date & time */}
      <div className="text-sm text-gray-700 shrink-0">
        <p className="font-medium">
          {new Date(b.start).toLocaleDateString("de-AT", {
            weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
          })}
        </p>
        <p className="text-gray-500">
          {new Date(b.start).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {new Date(b.end).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
          STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-600"
        }`}
      >
        {STATUS_LABEL[b.status] ?? b.status}
      </span>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2 shrink-0">
          <button
            disabled={isActing}
            onClick={() => onAccept(b.id)}
            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {isActing ? "…" : "Annehmen"}
          </button>
          <button
            disabled={isActing}
            onClick={() => onDecline(b.id)}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {isActing ? "…" : "Ablehnen"}
          </button>
        </div>
      )}

      {cancellable && (
        <button
          disabled={isActing}
          onClick={() => onCancel(b.id, b.priceCents)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {isActing ? "…" : "Stornieren"}
        </button>
      )}
    </div>
  );
}

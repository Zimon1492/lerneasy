"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Teacher = {
  id: string;
  name: string;
  subject: string;
};

type Booking = {
  id: string;
  start: string;
  end: string;
  priceCents: number;
  currency: string;
  status: string;
  note: string | null;
  teacher: Teacher;
};

type Rating = {
  teacherId: string;
  stars: number;
  comment: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:              { label: "Ausstehend",              color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  checkout_started:     { label: "Zahlung abgebrochen",     color: "text-orange-600 bg-orange-50 border-orange-200" },
  payment_method_saved: { label: "Warte auf Bestätigung",   color: "text-blue-600 bg-blue-50 border-blue-200" },
  confirmed:            { label: "Bestätigt",               color: "text-blue-600 bg-blue-50 border-blue-200" },
  paid:                 { label: "Bezahlt",                 color: "text-green-600 bg-green-50 border-green-200" },
  declined:             { label: "Abgelehnt",               color: "text-red-600 bg-red-50 border-red-200" },
  teacher_cancelled:    { label: "Abgesagt (Lehrer)",       color: "text-red-600 bg-red-50 border-red-200" },
  student_cancelled:    { label: "Von dir storniert",       color: "text-gray-600 bg-gray-50 border-gray-200" },
  canceled_by_system:   { label: "Automatisch storniert",   color: "text-gray-600 bg-gray-50 border-gray-200" },
  payment_failed:       { label: "Zahlung fehlgeschlagen",  color: "text-red-600 bg-red-50 border-red-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-AT", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function StarPicker({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition ${s <= (hover || value) ? "text-amber-400" : "text-gray-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingForm({ teacherId, teacherName, existing, onSaved }: {
  teacherId: string;
  teacherName: string;
  existing: Rating | null;
  onSaved: (r: Rating) => void;
}) {
  const [stars, setStars]     = useState(existing?.stars ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<string | null>(null);
  const [open, setOpen]       = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return;
    setSaving(true); setMsg(null);
    const res  = await fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, stars, comment: comment.trim() || null }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg("Bewertung gespeichert.");
      onSaved({ teacherId, stars, comment: comment.trim() || null });
      setOpen(false);
    } else {
      setMsg(json?.error ?? "Fehler beim Speichern.");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
      >
        {existing ? `Bewertung ändern (${existing.stars}★)` : `${teacherName} bewerten`}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <p className="text-sm font-medium text-gray-700">{existing ? "Bewertung ändern" : `${teacherName} bewerten`}</p>
      <StarPicker value={stars} onChange={setStars} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Kommentar (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
      />
      {msg && <p className={`text-xs ${msg.includes("Fehler") ? "text-red-600" : "text-green-700"}`}>{msg}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!stars || saving} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
          {saving ? "Speichern..." : "Abgeben"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// FAGG §4 pre-contractual disclosure shown before Stripe checkout
function CheckoutDisclosureModal({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const price = (booking.priceCents / 100).toFixed(2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Vor der Zahlung – Pflichtinformation</h2>
        <p className="text-sm text-gray-600">
          Bitte lies die folgenden Informationen, bevor du zur Zahlung weitergeleitet wirst
          (gem&auml;&szlig; &sect;&nbsp;4 FAGG):
        </p>

        <div className="text-sm text-gray-700 space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p><strong>Leistung:</strong> Nachhilfestunde bei {booking.teacher.name} ({booking.teacher.subject})</p>
          <p>
            <strong>Termin:</strong>{" "}
            {new Date(booking.start).toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })},{" "}
            {new Date(booking.start).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
            {" "}–{" "}
            {new Date(booking.end).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p><strong>Gesamtpreis (Endpreis):</strong> {price} {booking.currency.toUpperCase()}</p>
          <p>
            <strong>Anbieter:</strong> LernApp e.U., E-Mail:{" "}
            <a href="mailto:lerneazy.office@gmail.com" className="text-blue-600 underline">lerneazy.office@gmail.com</a>
          </p>
        </div>

        <div className="text-sm text-gray-700 border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-1">
          <p className="font-semibold text-amber-800">Widerrufsrecht (§ 11 FAGG)</p>
          <p>
            Du hast das Recht, binnen <strong>14 Tagen</strong> ohne Angabe von Gründen vom
            Vertrag zurückzutreten. Mit Bestätigung der Zahlung erklärst du dich ausdrücklich
            damit einverstanden, dass LernApp mit der Erbringung der Dienstleistung vor Ablauf
            der Widerrufsfrist beginnt. Du bestätigst, dass dein Widerrufsrecht mit vollständiger
            Erbringung der Dienstleistung erlischt.
          </p>
          <p>
            Widerruf per E-Mail an:{" "}
            <a href="mailto:lerneazy.office@gmail.com" className="text-blue-600 underline">lerneazy.office@gmail.com</a>.
            Das{" "}
            <a href="/agb#widerruf" className="text-blue-600 underline">Muster-Widerrufsformular</a>{" "}
            findest du in unseren AGB.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold"
          >
            Weiter zur Zahlung
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [payingId, setPayingId]       = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [ratings, setRatings]         = useState<Rating[]>([]);
  const [disclosureBooking, setDisclosureBooking] = useState<Booking | null>(null);

  const successBookingId = searchParams.get("booking");
  const wasSuccess   = searchParams.get("success") === "1";
  const wasCancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    fetch("/api/student/bookings", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const bks: Booking[] = json.bookings ?? [];
        setBookings(bks);

        // Load ratings for all teachers with paid bookings
        const paidTeacherIds = [...new Set(bks.filter((b) => b.status === "paid").map((b) => b.teacher.id))];
        Promise.all(
          paidTeacherIds.map((id) =>
            fetch(`/api/ratings?teacherId=${id}`, { cache: "no-store" })
              .then((r) => r.json())
              .catch(() => ({}))
          )
        ).then((results) => {
          const myRatings: Rating[] = [];
          results.forEach((r, i) => {
            // The ratings API returns all ratings; we need to identify our own.
            // We store per-teacherId from the ratings list (first entry is most recent).
            // Since the API returns all ratings and we upsert per student-teacher pair,
            // we track the teacherId we queried.
            if (r.myRating) {
              myRatings.push({ teacherId: paidTeacherIds[i], stars: r.myRating.stars, comment: r.myRating.comment });
            }
          });
          setRatings(myRatings);
        });
      })
      .catch(() => setError("Buchungen konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  // Show FAGG pre-contractual disclosure first, then proceed
  function handlePay(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) setDisclosureBooking(booking);
  }

  async function proceedToCheckout(bookingId: string) {
    setDisclosureBooking(null);
    setPayingId(bookingId);
    try {
      const res  = await fetch("/api/student/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Fehler beim Starten der Zahlung");
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
      setPayingId(null);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("Buchung wirklich stornieren?")) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/student/bookings/${bookingId}/cancel`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Fehler beim Stornieren");
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "student_cancelled" } : b)
      );
    } catch (e: any) {
      setError(e?.message ?? "Stornierung fehlgeschlagen");
    } finally {
      setCancellingId(null);
    }
  }

  function handleRatingSaved(r: Rating) {
    setRatings((prev) => {
      const without = prev.filter((x) => x.teacherId !== r.teacherId);
      return [...without, r];
    });
  }

  // Group bookings: show one rating form per teacher (not per booking)
  const ratedTeacherIds = new Set<string>();

  return (
    <>
    {disclosureBooking && (
      <CheckoutDisclosureModal
        booking={disclosureBooking}
        onConfirm={() => proceedToCheckout(disclosureBooking.id)}
        onCancel={() => setDisclosureBooking(null)}
      />
    )}
    <main className="min-h-screen bg-[#f3f5fb] px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Payments</h1>

        {wasSuccess && successBookingId && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
            Zahlungsdaten erfolgreich gespeichert. Deine Buchung wird nach Lehrerbest&auml;tigung abgerechnet.
          </div>
        )}
        {wasCancelled && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500">Lade Buchungen...</p>}
        {!loading && bookings.length === 0 && <p className="text-gray-500">Keine Buchungen vorhanden.</p>}

        <div className="space-y-4">
          {bookings.map((b) => {
            const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: "text-gray-600 bg-gray-50 border-gray-200" };
            const canPay = b.status === "pending";
            const canCancel = ["pending", "checkout_started", "payment_method_saved"].includes(b.status);
            const isPaid = b.status === "paid";

            // Show rating form only on the first paid booking per teacher
            const showRating = isPaid && !ratedTeacherIds.has(b.teacher.id);
            if (isPaid) ratedTeacherIds.add(b.teacher.id);

            const existingRating = ratings.find((r) => r.teacherId === b.teacher.id) ?? null;

            return (
              <div key={b.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold text-base">{b.teacher.name}</div>
                    <div className="text-sm text-gray-500 mb-1">{b.teacher.subject}</div>
                    <div className="text-sm text-gray-700">
                      {formatDate(b.start)} &middot; {formatTime(b.start)} &ndash; {formatTime(b.end)}
                    </div>
                    {b.note && <div className="text-xs text-gray-500 mt-1">Notiz: {b.note}</div>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <div className="text-sm font-semibold">
                      {(b.priceCents / 100).toFixed(2)} {b.currency.toUpperCase()}
                    </div>
                    {canPay && (
                      <button
                        onClick={() => handlePay(b.id)}
                        disabled={payingId === b.id}
                        className="mt-1 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {payingId === b.id ? "Weiterleitung..." : "Jetzt zahlen"}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="mt-1 rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === b.id ? "Storniere..." : "Stornieren"}
                      </button>
                    )}
                  </div>
                </div>

                {showRating && (
                  <RatingForm
                    teacherId={b.teacher.id}
                    teacherName={b.teacher.name}
                    existing={existingRating}
                    onSaved={handleRatingSaved}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-500">Lade...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}

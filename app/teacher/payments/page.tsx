"use client";

import { useEffect, useState } from "react";

type Student = { id: string; name: string | null; email: string };

type Booking = {
  id: string;
  start: string;
  end: string;
  priceCents: number;
  currency: string;
  status: string;
  note: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  student: Student;
};

type Payout = {
  id: string;
  amountCents: number;
  stripeTransferId: string | null;
  createdAt: string;
};

type PayoutInfo = {
  onboarded: boolean;
  stripeConnectAccountId: string | null;
  earnedCents: number;
  paidOutCents: number;
  availableCents: number;
  payouts: Payout[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:              { label: "Ausstehend",             color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  checkout_started:     { label: "Zahlung läuft",          color: "text-orange-700 bg-orange-50 border-orange-200" },
  payment_method_saved: { label: "Karte gespeichert",      color: "text-blue-700 bg-blue-50 border-blue-200" },
  confirmed:            { label: "Bestätigt",              color: "text-blue-700 bg-blue-50 border-blue-200" },
  accepted:             { label: "Angenommen",             color: "text-green-700 bg-green-50 border-green-200" },
  paid:                 { label: "Bezahlt",                color: "text-green-700 bg-green-50 border-green-200" },
  declined:             { label: "Abgelehnt",              color: "text-red-700 bg-red-50 border-red-200" },
  teacher_cancelled:    { label: "Abgesagt",               color: "text-red-700 bg-red-50 border-red-200" },
  student_cancelled:    { label: "Vom Schüler storniert",  color: "text-gray-600 bg-gray-50 border-gray-200" },
  canceled_by_system:   { label: "Automatisch storniert",  color: "text-gray-600 bg-gray-50 border-gray-200" },
  payment_failed:       { label: "Zahlung fehlgeschlagen", color: "text-red-700 bg-red-50 border-red-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-AT", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}
function formatEur(cents: number) {
  return (cents / 100).toFixed(2) + " EUR";
}

function calcStats(bookings: Booking[], teacherShare: number) {
  const now = new Date();
  const total = bookings.length;
  const paidCount = bookings.filter((b) => b.status === "paid").length;
  const pendingCount = bookings.filter((b) =>
    ["pending", "checkout_started", "payment_method_saved", "confirmed", "accepted"].includes(b.status)
  ).length;
  const failedCount = bookings.filter((b) =>
    ["payment_failed", "declined", "teacher_cancelled"].includes(b.status)
  ).length;

  // Only lessons that are paid AND already finished count as earned
  const completedRevenueCents = bookings
    .filter((b) => b.status === "paid" && new Date(b.end) < now)
    .reduce((sum, b) => sum + Math.floor(b.priceCents * teacherShare), 0);

  return { total, paidCount, pendingCount, failedCount, completedRevenueCents };
}

export default function TeacherPaymentsPage() {
  const [settings, setSettings] = useState<{ teacherShare: number }>({ teacherShare: 0.7 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [bookingsRes, payoutRes, settingsRes] = await Promise.all([
        fetch("/api/teacher/payments", { cache: "no-store" }),
        fetch("/api/teacher/payout", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);
      const bookingsJson = await bookingsRes.json().catch(() => ({}));
      const payoutJson = await payoutRes.json().catch(() => ({}));
      const settingsJson = await settingsRes.json().catch(() => ({}));
      setBookings(bookingsJson.bookings ?? []);
      if (payoutRes.ok) setPayoutInfo(payoutJson);
      if (settingsRes.ok && typeof settingsJson.teacherShare === "number") {
        setSettings({ teacherShare: settingsJson.teacherShare });
      }
    } catch {
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripeReturn") === "1" || params.get("stripeRefresh") === "1") {
      // Sync Stripe Connect status before loading page data
      fetch("/api/teacher/stripe-connect", { cache: "no-store" }).finally(() => load());
    } else {
      load();
    }
  }, []);

  async function connectStripe() {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const res = await fetch("/api/teacher/stripe-connect", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setConnectError(json?.error ?? "Fehler"); return; }
      window.location.href = json.url;
    } catch {
      setConnectError("Verbindung fehlgeschlagen.");
    } finally {
      setConnectLoading(false);
    }
  }

  async function requestPayout() {
    setPayoutLoading(true);
    setPayoutMsg(null);
    try {
      const res = await fetch("/api/teacher/payout", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setPayoutMsg("Fehler: " + (json?.error ?? "Unbekannt")); return; }
      setPayoutMsg(`Auszahlung von ${formatEur(json.amountCents)} wurde veranlasst.`);
      await load();
    } catch {
      setPayoutMsg("Fehler bei der Auszahlung.");
    } finally {
      setPayoutLoading(false);
    }
  }

  const stats = calcStats(bookings, settings.teacherShare);

  const filtered = bookings.filter((b) => {
    if (filter === "paid") return b.status === "paid";
    if (filter === "pending") return ["pending", "checkout_started", "payment_method_saved", "confirmed", "accepted"].includes(b.status);
    if (filter === "failed") return ["payment_failed", "declined", "teacher_cancelled"].includes(b.status);
    return true;
  });

  const now = new Date();

  return (
    <main className="min-h-screen bg-gray-50 px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* STATISTIKEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Gesamt</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Bezahlt</div>
          <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Ausstehend</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Einnahmen</div>
          <div className="text-xl font-bold text-blue-600">
            {payoutInfo ? formatEur(payoutInfo.earnedCents) : formatEur(stats.completedRevenueCents)}
          </div>
        </div>
      </div>

      {/* AUSZAHLUNG */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
        <h2 className="font-semibold text-base mb-3">Auszahlung</h2>

        {!payoutInfo ? (
          <p className="text-gray-400 text-sm">Lade...</p>
        ) : !payoutInfo.onboarded ? (
          /* ── Stripe not connected ── */
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">Stripe-Konto noch nicht verbunden</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Verbinde dein Stripe Express-Konto, um deine Einnahmen auszahlen zu lassen.
              </p>
              {connectError && <p className="text-red-600 text-xs mt-1">{connectError}</p>}
            </div>
            <button
              onClick={connectStripe}
              disabled={connectLoading}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {connectLoading ? "Verbinde..." : "Stripe-Konto verbinden"}
            </button>
          </div>
        ) : (
          /* ── Stripe connected ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="text-xs text-gray-500 mb-0.5">Verdient gesamt</div>
                <div className="font-bold">{formatEur(payoutInfo.earnedCents)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="text-xs text-gray-500 mb-0.5">Bereits ausgezahlt</div>
                <div className="font-bold">{formatEur(payoutInfo.paidOutCents)}</div>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="text-xs text-gray-500 mb-0.5">Verfügbar</div>
                <div className="font-bold text-green-700">{formatEur(payoutInfo.availableCents)}</div>
              </div>
            </div>

            {payoutMsg && (
              <p className={`text-sm ${payoutMsg.startsWith("Fehler") ? "text-red-600" : "text-green-700"}`}>
                {payoutMsg}
              </p>
            )}

            <button
              onClick={requestPayout}
              disabled={payoutLoading || payoutInfo.availableCents <= 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              {payoutLoading ? "Wird verarbeitet..." : `${formatEur(payoutInfo.availableCents)} auszahlen`}
            </button>

            {/* Payout history */}
            {payoutInfo.payouts.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Auszahlungshistorie</p>
                <div className="space-y-1.5">
                  {payoutInfo.payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2 bg-gray-50">
                      <span className="text-gray-700">
                        {new Date(p.createdAt).toLocaleDateString("de-AT")}
                      </span>
                      <span className="font-semibold">{formatEur(p.amountCents)}</span>
                      {p.stripeTransferId && (
                        <span className="text-xs text-gray-400 font-mono hidden sm:block">
                          {p.stripeTransferId.slice(0, 16)}…
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "paid", "pending", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f === "all" ? "Alle" : f === "paid" ? "Bezahlt" : f === "pending" ? "Ausstehend" : "Fehlgeschlagen"}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Lade Buchungen...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-gray-500">Keine Buchungen gefunden.</p>
      )}

      {/* BUCHUNGSLISTE */}
      <div className="space-y-3">
        {filtered.map((b) => {
          const statusInfo = STATUS_LABELS[b.status] ?? {
            label: b.status,
            color: "text-gray-600 bg-gray-50 border-gray-200",
          };
          const isCompleted = b.status === "paid" && new Date(b.end) < now;
          const teacherShare = Math.floor(b.priceCents * settings.teacherShare);

          return (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-base">
                    {b.student.name || b.student.email}
                  </div>
                  <div className="text-sm text-gray-500">{b.student.email}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {formatDate(b.start)} &middot; {formatTime(b.start)} &ndash; {formatTime(b.end)}
                  </div>
                  {b.note && (
                    <div className="text-xs text-gray-500 mt-1">Notiz: {b.note}</div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <div className="text-right">
                    {b.status === "paid" ? (
                      <>
                        <div className={`text-sm font-semibold ${isCompleted ? "text-green-700" : "text-gray-700"}`}>
                          {(teacherShare / 100).toFixed(2)} {b.currency.toUpperCase()}
                        </div>
                        {!isCompleted && (
                          <div className="text-xs text-gray-400 mt-0.5">Stunde noch ausstehend</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm font-semibold text-gray-500">
                        {(teacherShare / 100).toFixed(2)} {b.currency.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

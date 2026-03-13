"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  start: string;
  end: string;
  priceCents: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  payoutAvailableAt: string | null;
  teacher: { id: string; name: string; email: string };
  student: { id: string; name: string | null; email: string };
};

const STATUS_OPTIONS = ["pending", "checkout_started", "confirmed", "accepted", "paid", "teacher_paid", "declined", "teacher_cancelled", "payment_failed"];

const STATUS_COLORS: Record<string, string> = {
  pending:              "text-yellow-700 bg-yellow-50 border-yellow-200",
  checkout_started:     "text-orange-700 bg-orange-50 border-orange-200",
  confirmed:            "text-blue-700 bg-blue-50 border-blue-200",
  accepted:             "text-green-700 bg-green-50 border-green-200",
  paid:                 "text-green-700 bg-green-100 border-green-300",
  teacher_paid:         "text-blue-700 bg-blue-100 border-blue-300",
  declined:             "text-red-700 bg-red-50 border-red-200",
  teacher_cancelled:    "text-red-700 bg-red-50 border-red-200",
  payment_failed:       "text-red-700 bg-red-100 border-red-300",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    const json = await res.json();
    setBookings(json.bookings ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Buchung wirklich löschen?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function handleReleasePayout(id: string) {
    if (!confirm("Auszahlung für diese Buchung sofort freigeben?")) return;
    setReleasingId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releasePayout: true }),
    });
    setReleasingId(null);
    load();
  }

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    load();
  }

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch =
      search === "" ||
      b.teacher.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.student.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.student.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Buchungen</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} gesamt</p>
        </div>
        <input
          type="text"
          placeholder="Lehrer oder Schüler suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      {/* STATUS FILTER */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"}`}
        >
          Alle
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filter === s ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400">Lade...</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Lehrer</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Schüler</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Termin</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Betrag</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.teacher.name}</div>
                  <div className="text-xs text-gray-400">{b.teacher.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.student.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{b.student.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  <div>{new Date(b.start).toLocaleDateString("de-AT", { timeZone: "UTC" })}</div>
                  <div>
                    {new Date(b.start).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                    {" – "}
                    {new Date(b.end).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {(b.priceCents / 100).toFixed(2)} {b.currency.toUpperCase()}
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={b.status}
                    disabled={updatingId === b.id}
                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer ${STATUS_COLORS[b.status] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right space-y-1">
                  {b.status === "paid" && (
                    <div>
                      {b.payoutAvailableAt ? (
                        <span className="text-xs text-green-600 font-medium">✅ Freigegeben</span>
                      ) : (
                        <button
                          onClick={() => handleReleasePayout(b.id)}
                          disabled={releasingId === b.id}
                          className="text-xs text-orange-600 hover:text-orange-800 disabled:opacity-40 font-medium"
                        >
                          {releasingId === b.id ? "..." : "💸 Auszahlung freigeben"}
                        </button>
                      )}
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                    >
                      {deletingId === b.id ? "Lösche..." : "Löschen"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Keine Buchungen gefunden.</p>
        )}
      </div>
    </div>
  );
}

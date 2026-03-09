"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  teachers: number;
  students: number;
  bookings: number;
  applications: number;
  pendingBookings: number;
  totalRevenueCents: number;
};

const CARDS = [
  { key: "teachers",     label: "Lehrer",         href: "/admin/teachers",     color: "border-blue-200 bg-blue-50",   text: "text-blue-700",  icon: "🎓" },
  { key: "students",     label: "Schüler",         href: "/admin/students",     color: "border-green-200 bg-green-50", text: "text-green-700", icon: "👤" },
  { key: "bookings",     label: "Buchungen",       href: "/admin/bookings",     color: "border-purple-200 bg-purple-50",text: "text-purple-700",icon: "📅" },
  { key: "applications", label: "Bewerbungen",     href: "/admin/applications", color: "border-orange-200 bg-orange-50",text: "text-orange-700",icon: "📋" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8 text-sm">Übersicht aller Daten in der Datenbank.</p>

      {loading && <p className="text-gray-400">Lade Statistiken...</p>}

      {stats && (
        <>
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition ${card.color}`}
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-3xl font-bold ${card.text}`}>
                  {(stats as any)[card.key] ?? 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">{card.label}</div>
              </Link>
            ))}
          </div>

          {/* EXTRA STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-5">
              <div className="text-sm text-gray-500 mb-1">Offene Buchungen</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</div>
              <Link href="/admin/bookings" className="text-xs text-blue-600 mt-2 inline-block hover:underline">
                Alle Buchungen ansehen →
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
              <div className="text-sm text-gray-500 mb-1">Gesamteinnahmen (bezahlt)</div>
              <div className="text-3xl font-bold text-green-600">
                {(stats.totalRevenueCents / 100).toFixed(2)} EUR
              </div>
              <Link href="/admin/bookings" className="text-xs text-blue-600 mt-2 inline-block hover:underline">
                Buchungen ansehen →
              </Link>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Schnellzugriff
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/teachers/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                + Lehrer anlegen
              </Link>
              <Link
                href="/admin/applications"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
              >
                Bewerbungen prüfen
              </Link>
              <Link
                href="/admin/bookings"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                Buchungen verwalten
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { calcHourlyPrice } from "@/app/lib/pricing";

type Rating = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  student: { name: string | null };
};

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400">
      {Array.from({ length: 5 }, (_, i) => (i < stars ? "★" : "☆")).join("")}
    </span>
  );
}

export default function TeacherRatingsPage() {
  const [settings, setSettings] = useState({ priceMin: 25, priceMax: 45, priceN: 15, teacherShare: 0.7 });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/ratings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([data, s]) => {
        if (!data.ok) throw new Error(data.error ?? "Fehler");
        setRatings(data.ratings ?? []);
        setAvg(data.avg ?? null);
        setCount(data.count ?? 0);
        if (s && typeof s.priceMin === "number") {
          setSettings({ priceMin: s.priceMin, priceMax: s.priceMax, priceN: s.priceN, teacherShare: s.teacherShare });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hourlyPrice = calcHourlyPrice(count, avg, settings.priceMin, settings.priceMax, settings.priceN);
  const teacherWage = hourlyPrice * settings.teacherShare;

  // Progress: wie weit zwischen MIN und MAX
  const progressPct = Math.round(
    ((hourlyPrice - settings.priceMin) / (settings.priceMax - settings.priceMin)) * 100
  );

  // Verteilung 1–5 Sterne
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.stars === star).length,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Bewertungen & Stundenlohn</h1>

      {loading && <p className="text-gray-500">Lade...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* ── Stundenlohn-Karte ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-base text-gray-700">Dein aktueller Stundenlohn</h2>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-700">
                  {teacherWage.toFixed(2).replace(".", ",")} €
                  <span className="text-lg font-normal text-gray-500">/h</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {Math.round(settings.teacherShare * 100)}&nbsp;% von {hourlyPrice.toFixed(2).replace(".", ",")} €/h Schülerpreis
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>{count} Bewertung{count !== 1 ? "en" : ""}</div>
                {avg !== null && (
                  <div className="text-amber-500 font-medium">Ø {avg.toFixed(1)} ★</div>
                )}
              </div>
            </div>

            {/* Fortschrittsbalken */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{(settings.priceMin * settings.teacherShare).toFixed(2).replace(".", ",")} € (neu)</span>
                <span>{(settings.priceMax * settings.teacherShare).toFixed(2).replace(".", ",")} € (max)</span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.max(2, progressPct)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center">
                {progressPct}% des möglichen Maximums erreicht
              </div>
            </div>

            {count === 0 && (
              <p className="text-sm text-gray-500 bg-blue-50 rounded-xl px-4 py-3">
                Du hast noch keine Bewertungen. Dein Stundenlohn steigt automatisch mit jeder positiven Bewertung.
              </p>
            )}
          </div>

          {/* ── Stern-Verteilung ── */}
          {count > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-base text-gray-700">Bewertungsübersicht</h2>
              <div className="space-y-2">
                {distribution.map(({ star, count: c }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-amber-400 w-8 shrink-0">{star} ★</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: count > 0 ? `${(c / count) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-6 text-right shrink-0">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Einzelne Bewertungen ── */}
          <div className="space-y-3">
            <h2 className="font-semibold text-base text-gray-700">
              {count > 0 ? `Alle Bewertungen (${count})` : "Noch keine Bewertungen"}
            </h2>
            {ratings.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <StarRow stars={r.stars} />
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("de-AT")}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {r.student.name ?? "Schüler/in"}
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-700 pt-1">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

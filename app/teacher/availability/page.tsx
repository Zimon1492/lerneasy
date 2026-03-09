"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type UnavailabilityPeriod = {
  id: string;
  fromDate: string;
  toDate: string;
  note: string | null;
};

type DaySchedule = {
  weekday: number;
  fromTime: string;
  toTime: string;
  active: boolean;
};

const WEEKDAYS = [
  { index: 0, label: "Montag" },
  { index: 1, label: "Dienstag" },
  { index: 2, label: "Mittwoch" },
  { index: 3, label: "Donnerstag" },
  { index: 4, label: "Freitag" },
  { index: 5, label: "Samstag" },
  { index: 6, label: "Sonntag" },
];

const DEFAULT_SCHEDULE: DaySchedule[] = WEEKDAYS.map((d) => ({
  weekday: d.index,
  fromTime: "09:00",
  toTime: "18:00",
  active: d.index <= 4, // Mon–Fri active by default
}));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TeacherAvailabilityPage() {
  const { data: session, status } = useSession();

  // Unavailability periods
  const [periods, setPeriods] = useState<UnavailabilityPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Weekly schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  async function loadPeriods() {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const email = encodeURIComponent(session.user.email);
      const res = await fetch(`/api/teacher/unavailability?email=${email}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setPeriods(json.data || []);
    } catch {
      setMsg("Fehler beim Laden der Zeiträume.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedule() {
    if (!session?.user?.email) return;
    setScheduleLoading(true);
    try {
      const email = encodeURIComponent(session.user.email);
      const res = await fetch(`/api/teacher/weekly-schedule?email=${email}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const data: DaySchedule[] = json.data || [];
      if (data.length > 0) {
        // Merge loaded data into default schedule (keep defaults for missing days)
        setSchedule(
          DEFAULT_SCHEDULE.map((def) => {
            const found = data.find((d) => d.weekday === def.weekday);
            return found ? { ...def, ...found } : def;
          })
        );
      } else {
        // No schedule saved yet — persist the defaults automatically
        await fetch("/api/teacher/weekly-schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email, schedule: DEFAULT_SCHEDULE }),
        });
        // state is already DEFAULT_SCHEDULE, nothing else to update
      }
    } finally {
      setScheduleLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      loadPeriods();
      loadSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function addPeriod() {
    if (!session?.user?.email) return;
    if (!fromDate || !toDate) { setMsg("Bitte Von- und Bis-Datum angeben."); return; }
    if (new Date(toDate) < new Date(fromDate)) { setMsg("Das Enddatum muss nach dem Startdatum liegen."); return; }

    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/teacher/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, fromDate, toDate, note: note.trim() || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || `Fehler ${res.status}`);
    } else {
      setMsg("Zeitraum gespeichert.");
      setFromDate(""); setToDate(""); setNote("");
      await loadPeriods();
    }
    setSaving(false);
  }

  async function deletePeriod(id: string) {
    if (!session?.user?.email) return;
    if (!confirm("Zeitraum wirklich löschen?")) return;
    setMsg(null);
    const email = encodeURIComponent(session.user.email);
    const res = await fetch(`/api/teacher/unavailability/${encodeURIComponent(id)}?email=${email}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(json?.error || `Fehler ${res.status}`); }
    else { setMsg("Zeitraum gelöscht."); await loadPeriods(); }
  }

  function updateDay(weekday: number, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d))
    );
  }

  async function saveSchedule() {
    if (!session?.user?.email) return;
    setScheduleSaving(true);
    setScheduleMsg(null);
    const res = await fetch("/api/teacher/weekly-schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, schedule }),
    });
    const json = await res.json().catch(() => ({}));
    setScheduleMsg(res.ok ? "Wochenplan gespeichert." : json?.error || "Fehler");
    setScheduleSaving(false);
  }

  if (status === "loading") {
    return <main className="min-h-screen bg-gray-50 px-6 py-10">Lade...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Verfügbarkeit</h1>
        <p className="text-gray-600 mb-8">
          Lege deinen Wochenplan fest und trage ein, wann du <strong>nicht</strong> erreichbar bist.
        </p>

        {/* ── Wochenplan ── */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-lg mb-1">Verfügbare Zeiten pro Wochentag</h2>
          <p className="text-sm text-gray-500 mb-5">
            Aktiviere die Tage, an denen du unterrichtest, und gib deine Zeitfenster an.
          </p>

          {scheduleMsg && (
            <p className={`mb-4 text-sm ${scheduleMsg.includes("Fehler") ? "text-red-600" : "text-green-700"}`}>
              {scheduleMsg}
            </p>
          )}

          {scheduleLoading ? (
            <p className="text-gray-400 text-sm">Lade...</p>
          ) : (
            <div className="space-y-3">
              {WEEKDAYS.map((wd) => {
                const day = schedule.find((d) => d.weekday === wd.index)!;
                return (
                  <div key={wd.index} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl border transition ${day.active ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                    {/* Toggle + Label */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => updateDay(wd.index, "active", !day.active)}
                        className={`w-10 h-6 rounded-full transition-colors shrink-0 ${day.active ? "bg-blue-600" : "bg-gray-300"}`}
                        aria-label={day.active ? "Deaktivieren" : "Aktivieren"}
                      >
                        <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-transform ${day.active ? "translate-x-4" : ""}`} />
                      </button>
                      <span className={`w-24 text-sm font-medium ${day.active ? "text-gray-800" : "text-gray-400"}`}>
                        {wd.label}
                      </span>
                    </div>

                    {/* Times */}
                    {day.active ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="time"
                          value={day.fromTime}
                          onChange={(e) => updateDay(wd.index, "fromTime", e.target.value)}
                          className="border rounded-lg px-3 py-1.5 text-sm min-w-0"
                        />
                        <span className="text-gray-400 text-sm">bis</span>
                        <input
                          type="time"
                          value={day.toTime}
                          onChange={(e) => updateDay(wd.index, "toTime", e.target.value)}
                          className="border rounded-lg px-3 py-1.5 text-sm min-w-0"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Nicht verfügbar</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={saveSchedule}
            disabled={scheduleSaving || scheduleLoading}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {scheduleSaving ? "Speichern..." : "Wochenplan speichern"}
          </button>
        </div>

        {/* ── Abwesenheiten ── */}
        {msg && (
          <p className={`mb-4 text-sm ${msg.includes("Fehler") ? "text-red-600" : "text-green-700"}`}>
            {msg}
          </p>
        )}

        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Nicht verfügbar von ... bis ...</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Von</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bis</label>
              <input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Grund (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z.B. Urlaub, Schulwoche..." className="w-full border rounded-lg px-3 py-2" />
          </div>

          <button onClick={addPeriod} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60">
            {saving ? "Speichern..." : "Eintragen"}
          </button>
        </div>

        {/* ── Abwesenheitsliste ── */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Eingetragene Abwesenheiten</h2>

          {loading && <p className="text-gray-500">Lade...</p>}
          {!loading && periods.length === 0 && (
            <p className="text-gray-500">Keine Abwesenheiten eingetragen.</p>
          )}

          <div className="space-y-3">
            {periods.map((p) => (
              <div key={p.id} className="border rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{formatDate(p.fromDate)} &ndash; {formatDate(p.toDate)}</div>
                  {p.note && <div className="text-sm text-gray-500 mt-0.5">{p.note}</div>}
                </div>
                <button onClick={() => deletePeriod(p.id)} className="text-red-600 hover:underline text-sm font-medium shrink-0">
                  Löschen
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/Avatar";
import { calcHourlyPrice } from "@/app/lib/pricing";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  offerSubjects?: string[];
  profilePicture?: string | null;
  description?: string | null;
  avgRating?: number | null;
  ratingCount?: number;
};

type RatingItem = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  student: { name: string | null };
};

type WeekdaySchedule = {
  weekday: number; // 0=Mon … 6=Sun
  fromTime: string;
  toTime: string;
  active: boolean;
};

type BlockedPeriod = {
  id: string;
  fromDate: string;
  toDate: string;
  note: string | null;
};

type BookedSlot = { start: string; end: string };

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_FULL   = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONTH_NAMES    = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// JS Date.getDay(): 0=Sun,1=Mon…6=Sat  →  our model: 0=Mon…6=Sun
function jsWeekdayToOurs(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function dateToOurWeekday(dateStr: string): number {
  return jsWeekdayToOurs(new Date(dateStr + "T12:00:00").getDay());
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function calcHours(s: string, e: string): number {
  if (!s || !e) return 0;
  return Math.max(0, (toMinutes(e) - toMinutes(s)) / 60);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateBlocked(dateStr: string, periods: BlockedPeriod[]): boolean {
  const d = new Date(dateStr + "T12:00:00");
  return periods.some((p) => {
    const from = new Date(p.fromDate); from.setHours(0, 0, 0, 0);
    const to   = new Date(p.toDate);   to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  });
}

function isTimeOverlapping(start: string, end: string, booked: BookedSlot[]): BookedSlot | null {
  if (!start || !end) return null;
  const s = toMinutes(start), e = toMinutes(end);
  return booked.find((b) => s < toMinutes(b.end) && e > toMinutes(b.start)) ?? null;
}

function parseSubjects(raw: string | null | undefined): string[] {
  return (raw || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// ── Custom Calendar ────────────────────────────────────────────────
function CalendarPicker({
  value,
  onChange,
  weeklySchedule,
  blockedPeriods,
}: {
  value: string;
  onChange: (date: string) => void;
  weeklySchedule: WeekdaySchedule[];
  blockedPeriods: BlockedPeriod[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth()); // 0-based

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build grid: first cell = Monday of the week containing the 1st of the month
  const firstDay  = new Date(viewYear, viewMonth, 1);
  // JS: 0=Sun..6=Sat → shift so Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  function dayStatus(dayNum: number): "past" | "unavailable" | "available" | "selected" {
    const d = new Date(viewYear, viewMonth, dayNum);
    d.setHours(0, 0, 0, 0);
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    if (d <= today) return "past";
    if (iso === value) return "selected";

    // Check weekly schedule
    const ourWd = jsWeekdayToOurs(d.getDay());
    const sched = weeklySchedule.find(s => s.weekday === ourWd);
    if (!sched || !sched.active) return "unavailable";

    // Check blocked periods
    if (isDateBlocked(iso, blockedPeriods)) return "unavailable";

    return "available";
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-800 text-lg font-semibold transition">‹</button>
        <span className="font-semibold text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-800 text-lg font-semibold transition">›</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1 border-b border-gray-200 pb-2">
        {WEEKDAY_LABELS.map(l => (
          <div key={l} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wide">{l}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px mt-1">
        {cells.map((dayNum, idx) => {
          if (!dayNum) return <div key={idx} className="py-2" />;
          const status = dayStatus(dayNum);
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

          const styles: Record<string, string> = {
            past:        "text-gray-300 cursor-default",
            unavailable: "bg-red-50 text-red-300 cursor-not-allowed line-through",
            available:   "bg-white hover:bg-green-50 hover:text-green-800 text-gray-700 cursor-pointer border border-transparent hover:border-green-200 transition",
            selected:    "bg-blue-600 text-white cursor-pointer shadow-sm font-bold",
          };

          return (
            <button
              key={idx}
              type="button"
              disabled={status === "past" || status === "unavailable"}
              onClick={() => onChange(iso)}
              className={`py-2 text-sm rounded-lg font-medium text-center ${styles[status]}`}
              title={status === "unavailable" ? "Nicht verfügbar" : undefined}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-white border border-gray-300" />Verfügbar</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-100" />Nicht verfügbar</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600" />Ausgewählt</span>
      </div>
    </div>
  );
}

export default function BookPage() {
  const router   = useRouter();
  const pathname = usePathname() ?? "";
  const teacherId = pathname.split("/").at(-1) ?? "";
  const { data: session, status: authStatus } = useSession();

  const [teacher, setTeacher]         = useState<Teacher | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState(true);

  // Availability data
  const [weeklySchedule, setWeeklySchedule] = useState<WeekdaySchedule[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [teachesStudent, setTeachesStudent] = useState<boolean | null>(null);
  const [availLoaded, setAvailLoaded]       = useState(false);

  // Booked slots for selected date
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  // Form state
  const [studentName,    setStudentName]    = useState("");
  const [studentEmail,   setStudentEmail]   = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate,   setSelectedDate]   = useState("");
  const [startTime,      setStartTime]      = useState("");
  const [endTime,        setEndTime]        = useState("");
  const [note,           setNote]           = useState("");

  // Ratings
  const [ratings,          setRatings]          = useState<RatingItem[]>([]);
  const [canRate,          setCanRate]          = useState(false);
  const [myRating,         setMyRating]         = useState<{ stars: number; comment: string } | null>(null);
  const [ratingStars,      setRatingStars]      = useState(0);
  const [ratingComment,    setRatingComment]    = useState("");
  const [ratingMsg,        setRatingMsg]        = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [settings, setSettings] = useState({ priceMin: 25, priceMax: 45, priceN: 15, teacherShare: 0.7 });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Load platform settings
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => {
        if (s && typeof s.priceMin === "number") {
          setSettings({ priceMin: s.priceMin, priceMax: s.priceMax, priceN: s.priceN, teacherShare: s.teacherShare });
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name  && !studentName)  setStudentName(session.user.name);
      if (session.user.email && !studentEmail) setStudentEmail(session.user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Load teacher
  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      setLoadingTeacher(true);
      try {
        const res  = await fetch(`/api/teachers/${teacherId}`, { cache: "no-store" });
        const json = await res.json();
        const found: Teacher = json.data ?? null;
        setTeacher(found);
        setRatings(json.data?.ratings ?? []);
        const subs = parseSubjects(found?.subject);
        if (subs.length > 0) setSelectedSubject(subs[0]);
      } catch {
        setError("Lehrer konnte nicht geladen werden.");
      } finally {
        setLoadingTeacher(false);
      }
    })();
  }, [teacherId]);

  // Load availability info (schedule + blocked + school-type match)
  useEffect(() => {
    if (!teacherId) return;
    const email = session?.user?.email ?? "";
    (async () => {
      try {
        const params = new URLSearchParams({ teacherId });
        if (email) params.set("studentEmail", email);
        const res  = await fetch(`/api/student/teacher-availability?${params}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        setWeeklySchedule(json.weeklySchedule ?? []);
        setBlockedPeriods(json.blockedPeriods ?? []);
        setTeachesStudent(json.teachesStudent ?? null);
      } catch { /* non-critical */ }
      finally { setAvailLoaded(true); }
    })();
  }, [teacherId, session]);

  // Load booked slots for selected date
  useEffect(() => {
    if (!teacherId || !selectedDate) { setBookedSlots([]); return; }
    (async () => {
      try {
        const res  = await fetch(`/api/student/teacher-booked-slots?teacherId=${encodeURIComponent(teacherId)}&date=${selectedDate}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        setBookedSlots(json.slots || []);
      } catch { /* non-critical */ }
    })();
  }, [teacherId, selectedDate]);

  // Ratings check
  useEffect(() => {
    if (!teacherId || !session?.user?.email) return;
    (async () => {
      try {
        const [bookRes, ratRes] = await Promise.all([
          fetch("/api/bookings/student", { cache: "no-store" }),
          fetch(`/api/ratings?teacherId=${teacherId}`, { cache: "no-store" }),
        ]);
        const bookJson = await bookRes.json().catch(() => ({}));
        setCanRate((bookJson.bookings ?? []).some(
          (b: { teacherId: string; status: string }) => b.teacherId === teacherId && b.status === "paid"
        ));
        const ratJson = await ratRes.json().catch(() => ({}));
        setRatings(ratJson.ratings ?? []);
      } catch { /* non-critical */ }
    })();
  }, [teacherId, session]);

  // ── Derived state ────────────────────────────────────────────────
  // Prefer subjects from actual TeachingOffers; fall back to Teacher.subject string
  const subjects = useMemo(() => {
    if (teacher?.offerSubjects && teacher.offerSubjects.length > 0) return teacher.offerSubjects;
    return parseSubjects(teacher?.subject);
  }, [teacher]);
  const hours    = useMemo(() => calcHours(startTime, endTime), [startTime, endTime]);
  const hourlyPrice = useMemo(
    () => calcHourlyPrice(teacher?.ratingCount ?? 0, teacher?.avgRating ?? null, settings.priceMin, settings.priceMax, settings.priceN),
    [teacher, settings]
  );
  const priceCents   = Math.round(hours * hourlyPrice * 100);
  const priceFormatted = (priceCents / 100).toFixed(2).replace(".", ",");

  // Selected date checks
  const selectedWeekday   = selectedDate ? dateToOurWeekday(selectedDate) : null;
  const scheduleForDay    = selectedWeekday !== null ? weeklySchedule.find((d) => d.weekday === selectedWeekday) : null;
  const dayInSchedule     = scheduleForDay?.active ?? false;
  const dateBlocked       = selectedDate ? isDateBlocked(selectedDate, blockedPeriods) : false;
  const dateUnavailable   = selectedDate ? (!dayInSchedule || dateBlocked) : false;

  // Time checks
  const scheduleFrom = scheduleForDay?.fromTime ?? "";
  const scheduleTo   = scheduleForDay?.toTime   ?? "";
  const timeBeforeSchedule = startTime && scheduleFrom && toMinutes(startTime) < toMinutes(scheduleFrom);
  const timeAfterSchedule  = endTime   && scheduleTo   && toMinutes(endTime)   > toMinutes(scheduleTo);
  const timeOutOfSchedule  = dayInSchedule && (timeBeforeSchedule || timeAfterSchedule);
  const timeValid          = hours > 0 && startTime < endTime && !timeOutOfSchedule;
  const overlappingSlot    = timeValid ? isTimeOverlapping(startTime, endTime, bookedSlots) : null;

  const [agbAccepted, setAgbAccepted] = useState(false);

  const canSubmit =
    !!teacher && !!studentName.trim() && !!studentEmail.trim() &&
    !!selectedSubject && !!selectedDate &&
    !dateUnavailable && timeValid && !overlappingSlot && agbAccepted && !submitting;

  // ── Handlers ─────────────────────────────────────────────────────
  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingStars || !teacherId) return;
    setRatingSubmitting(true); setRatingMsg(null);
    const res  = await fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId, stars: ratingStars, comment: ratingComment.trim() || null }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setRatingMsg("Bewertung gespeichert.");
      setMyRating({ stars: ratingStars, comment: ratingComment.trim() });
      const r2 = await fetch(`/api/ratings?teacherId=${teacherId}`, { cache: "no-store" });
      setRatings((await r2.json().catch(() => ({}))).ratings ?? []);
    } else { setRatingMsg(json?.error ?? "Fehler beim Speichern."); }
    setRatingSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacher || !canSubmit) return;
    setError(null); setSubmitting(true);
    try {
      const bookRes  = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId: teacher.id, studentName: studentName.trim(), studentEmail: studentEmail.trim().toLowerCase(), start: `${selectedDate}T${startTime}:00`, end: `${selectedDate}T${endTime}:00`, note: note.trim() || null }) });
      const bookJson = await bookRes.json().catch(() => ({}));
      if (!bookRes.ok) throw new Error(bookJson?.error || `Fehler ${bookRes.status}`);
      const bookingId = bookJson.booking?.id;
      if (!bookingId) throw new Error("Keine Buchungs-ID erhalten.");
      const checkoutRes  = await fetch("/api/student/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
      const checkoutJson = await checkoutRes.json().catch(() => ({}));
      if (!checkoutRes.ok) throw new Error(checkoutJson?.error || `Fehler ${checkoutRes.status}`);
      window.location.href = checkoutJson.url;
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler.");
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  if (authStatus === "loading" || loadingTeacher) {
    return <main className="min-h-screen bg-[#f5f7fa] flex justify-center items-center"><p className="text-gray-500">Lade...</p></main>;
  }
  if (!teacher) {
    return <main className="min-h-screen bg-[#f5f7fa] flex justify-center items-center"><p className="text-red-500">Lehrer nicht gefunden.</p></main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-5">

        {/* ── Teacher card ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-3">
            <Avatar src={teacher.profilePicture} name={teacher.name} size={64} className="w-16 h-16" />
            <div>
              <h1 className="text-2xl font-bold">{teacher.name}</h1>
              {teacher.avgRating != null && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-amber-400 text-sm">{Array.from({ length: 5 }, (_, i) => i < Math.round(teacher.avgRating!) ? "★" : "☆").join("")}</span>
                  <span className="text-xs text-gray-500">{teacher.avgRating.toFixed(1)} ({teacher.ratingCount ?? ratings.length} Bewertungen)</span>
                </div>
              )}
            </div>
          </div>
          {teacher.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-wrap">{teacher.description}</p>
          )}
        </div>

        {/* ── School type mismatch warning ── */}
        {teachesStudent === false && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-red-500 text-xl mt-0.5">⚠</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">Dieser Lehrer unterrichtet deinen Schultyp nicht</p>
              <p className="text-red-600 text-xs mt-0.5">Du kannst trotzdem anfragen, aber der Lehrer hat für deine Schule kein Angebot hinterlegt.</p>
            </div>
          </div>
        )}

        {/* ── Weekly schedule overview ── */}
        {availLoaded && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Verfügbarkeit des Lehrers</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => {
                const day = weeklySchedule.find((d) => d.weekday === i);
                const active = day?.active ?? false;
                const isSelected = selectedWeekday === i;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center rounded-xl py-2 px-1 text-center transition
                      ${active
                        ? isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-green-50 border border-green-200 text-green-800"
                        : "bg-gray-100 border border-gray-200 text-gray-400"
                      }`}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    {active ? (
                      <span className="text-[10px] mt-1 leading-tight">
                        {day!.fromTime}<br />–{day!.toTime}
                      </span>
                    ) : (
                      <span className="text-[10px] mt-1">—</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Grün = verfügbar · Grau = nicht verfügbar</p>
          </div>
        )}

        {/* ── Booking form ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-1">Termin buchen</h2>
          <p className="text-xs text-gray-500 mb-5">1 Stunde = {hourlyPrice.toFixed(2).replace(".", ",")} € · Mindestbuchung: 30 Minuten</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dein Name</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deine E-Mail</label>
                <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1">Fach</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                <option value="" disabled>Bitte wählen...</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Date — custom calendar */}
            <div>
              <label className="block text-sm font-medium mb-2">Datum wählen</label>
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <CalendarPicker
                  value={selectedDate}
                  onChange={(iso) => { setSelectedDate(iso); setStartTime(""); setEndTime(""); }}
                  weeklySchedule={weeklySchedule}
                  blockedPeriods={blockedPeriods}
                />
              </div>
              {selectedDate && dayInSchedule && !dateBlocked && (
                <p className="text-green-700 text-xs mt-2 flex items-center gap-1">
                  <span>✓</span> {WEEKDAY_FULL[selectedWeekday!]}, verfügbar {scheduleFrom} – {scheduleTo} Uhr
                </p>
              )}
            </div>

            {/* Time — only show when date is valid */}
            {selectedDate && dayInSchedule && !dateBlocked && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Von</label>
                    <input
                      type="time"
                      value={startTime}
                      min={scheduleFrom || undefined}
                      max={scheduleTo   || undefined}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 ${(overlappingSlot || timeBeforeSchedule) ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bis</label>
                    <input
                      type="time"
                      value={endTime}
                      min={startTime || scheduleFrom || undefined}
                      max={scheduleTo || undefined}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 ${(overlappingSlot || timeAfterSchedule) ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                      required
                    />
                  </div>
                </div>

                {timeOutOfSchedule && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1.5">
                    <span>⚠</span> Die gewählte Zeit liegt außerhalb des Verfügbarkeitsfensters ({scheduleFrom} – {scheduleTo} Uhr).
                  </p>
                )}

                {/* Booked slots hint */}
                {bookedSlots.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-xs text-gray-500 font-medium self-center">Bereits gebucht:</span>
                    {bookedSlots.map((s, i) => (
                      <span key={i} className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                        {s.start}–{s.end}
                      </span>
                    ))}
                  </div>
                )}

                {overlappingSlot && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1.5">
                    <span>⚠</span> Überschneidet sich mit einer bestehenden Buchung ({overlappingSlot.start}–{overlappingSlot.end}).
                  </p>
                )}

                {startTime && endTime && !timeValid && !timeOutOfSchedule && (
                  <p className="text-red-600 text-sm mt-1">Das Ende muss nach dem Start liegen.</p>
                )}
              </div>
            )}

            {/* Cost preview */}
            {hours > 0 && timeValid && (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-blue-800">{hours.toFixed(1).replace(".", ",")} Std. × {hourlyPrice.toFixed(2).replace(".", ",")} €</span>
                  <span className="font-bold text-blue-900 text-lg">{priceFormatted} €</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 items-start">
                  <span className="text-amber-500 text-lg shrink-0">ℹ</span>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-0.5">Jetzt wird noch kein Geld abgebucht.</p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      Du hinterlegst nur deine Zahlungsmethode. Der Betrag von <strong>{priceFormatted} €</strong> wird
                      erst dann abgebucht, wenn der Lehrer deinen Termin <strong>ausdrücklich annimmt</strong>.
                      Lehnt der Lehrer ab, erfolgt keinerlei Belastung.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-1">Was möchtest du lernen? (optional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px]" placeholder="z.B. Ich verstehe Integralrechnung nicht..." />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* AGB + Widerrufsrecht-Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agbAccepted}
                onChange={(e) => setAgbAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
              />
              <span className="text-sm text-gray-600">
                Ich akzeptiere die{" "}
                <a href="/agb" target="_blank" className="text-blue-600 underline">AGB</a>
                {" "}und habe die{" "}
                <a href="/datenschutz" target="_blank" className="text-blue-600 underline">Datenschutzerklärung</a>
                {" "}gelesen.{" "}
                <span className="text-gray-700">
                  Ich stimme ausdrücklich zu, dass LernEasy mit der Erbringung der Dienstleistung
                  vor Ablauf der 14-tägigen Widerrufsfrist beginnt, und nehme zur Kenntnis, dass
                  ich damit mein Widerrufsrecht mit vollständiger Erbringung der Leistung verliere
                  (gem. §&nbsp;18 Abs.&nbsp;1 Z&nbsp;11 FAGG).
                </span>
              </span>
            </label>

            <div className="space-y-2 pt-1">
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                  Abbrechen
                </button>
                <button type="submit" disabled={!canSubmit} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50">
                  {submitting ? "Bitte warten..." : `Kostenpflichtig anfragen${hours > 0 && timeValid ? ` — ${priceFormatted} €` : ""}`}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-right">
                Kein Geldabzug jetzt — Abbuchung nur bei Annahme durch den Lehrer.
              </p>
            </div>
          </form>
        </div>

        {/* ── Ratings ── */}
        {ratings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-3">Bewertungen</h2>
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400">{Array.from({ length: 5 }, (_, i) => i < r.stars ? "★" : "☆").join("")}</span>
                    <span className="text-sm text-gray-500">{r.student?.name ?? "Schüler"} · {new Date(r.createdAt).toLocaleDateString("de-AT")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rating form ── */}
        {canRate && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-3">{myRating ? "Deine Bewertung ändern" : "Lehrer bewerten"}</h2>
            <form onSubmit={submitRating} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRatingStars(s)} className={`text-3xl transition ${s <= ratingStars ? "text-amber-400" : "text-gray-300 hover:text-amber-200"}`}>★</button>
                ))}
              </div>
              <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Kommentar (optional)" className="w-full border rounded-lg px-3 py-2 text-sm min-h-[70px]" />
              {ratingMsg && <p className={`text-sm ${ratingMsg.includes("Fehler") ? "text-red-600" : "text-green-700"}`}>{ratingMsg}</p>}
              <button type="submit" disabled={ratingStars === 0 || ratingSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {ratingSubmitting ? "Speichern..." : "Bewertung abgeben"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

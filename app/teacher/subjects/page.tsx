// app/teacher/subjects/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Subject = { id: string; name: string };

type Offer = {
  id: string;
  schoolTrack: "AHS" | "BHS";
  schoolForm: string;
  level: "UNTERSTUFE" | "OBERSTUFE";
  minGrade: number;
  maxGrade: number;
  subject: { id: string; name: string };
  createdAt: string;
};

type TeacherProfile = {
  id: string;
  subject: string;
  unterstufeOnly: boolean;
  schoolTrack: string;    // AHS / BHS / BOTH
  allowedForms: string | null; // JSON-Array
  address: string | null;
  taxNumber: string | null;
};

type TrackValue = "AHS" | "BHS" | "ALL";
type LevelValue = "UNTERSTUFE" | "OBERSTUFE" | "ALL";
type FormValue = string | "ALL";

const SCHOOL_TRACKS = [
  { value: "ALL", label: "Alle" },
  { value: "AHS", label: "AHS" },
  { value: "BHS", label: "BHS" },
] as const;

const SCHOOL_FORMS: Record<"AHS" | "BHS", { value: string; label: string }[]> = {
  AHS: [
    { value: "ALL", label: "Alle" },
    { value: "AHS_GYMNASIUM", label: "Gymnasium / Klassisches Gymnasium" },
    { value: "AHS_REALGYMNASIUM", label: "Realgymnasium" },
    { value: "AHS_WK_REALGYMNASIUM", label: "Wirtschaftskundliches Realgymnasium" },
    { value: "AHS_BORG", label: "BORG (Oberstufenrealgymnasium)" },
    { value: "AHS_SCHWERPUNKT", label: "AHS mit Schwerpunkt (Sport/Musik/...)" },
  ],
  BHS: [
    { value: "ALL", label: "Alle" },
    { value: "BHS_HTL", label: "HTL" },
    { value: "BHS_HAK", label: "HAK" },
    { value: "BHS_HLW", label: "HLW / HWS" },
    { value: "BHS_MODE", label: "HLA Mode" },
    { value: "BHS_KUNST_GESTALTUNG", label: "HLA Kunst & Gestaltung" },
    { value: "BHS_TOURISMUS", label: "HLA Tourismus" },
    { value: "BHS_SOZIALPAED", label: "Sozial-/Elementarpädagogik" },
    { value: "BHS_LAND_FORST", label: "Land- & Forstwirtschaft" },
  ],
};

const LABEL_FORM: Record<string, string> = {
  ALL: "Alle",
  AHS_GYMNASIUM: "Gymnasium / Klassisches Gymnasium",
  AHS_REALGYMNASIUM: "Realgymnasium",
  AHS_WK_REALGYMNASIUM: "Wirtschaftskundliches Realgymnasium",
  AHS_BORG: "BORG (Oberstufenrealgymnasium)",
  AHS_SCHWERPUNKT: "AHS Schwerpunkt",
  BHS_HTL: "HTL",
  BHS_HAK: "HAK",
  BHS_HLW: "HLW / HWS",
  BHS_MODE: "HLA Mode",
  BHS_KUNST_GESTALTUNG: "HLA Kunst & Gestaltung",
  BHS_TOURISMUS: "HLA Tourismus",
  BHS_SOZIALPAED: "Sozial-/Elementarpädagogik",
  BHS_LAND_FORST: "Land- & Forstwirtschaft",
};

function levelLabel(l: "UNTERSTUFE" | "OBERSTUFE") {
  return l === "UNTERSTUFE" ? "Unterstufe" : "Oberstufe";
}

function parseTeacherSubjects(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeSubject(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

/**
 * ✅ Klassenlogik (deine Regeln)
 */
function gradeRangeFor(track: TrackValue, level: LevelValue) {
  if (track === "BHS") return { min: 5, max: 9 };

  if (track === "AHS") {
    if (level === "UNTERSTUFE") return { min: 1, max: 4 };
    if (level === "OBERSTUFE") return { min: 5, max: 8 };
    return { min: 1, max: 8 };
  }

  // ALL
  if (level === "ALL") return { min: 1, max: 9 };
  return { min: 1, max: 9 };
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function TeacherSubjectsPage() {
  const { data: session, status } = useSession();

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const unterstufeOnly = !!teacherProfile?.unterstufeOnly;

  // Erlaubte Schultypen aus Profil ableiten
  const profileTrack = teacherProfile?.schoolTrack ?? "BOTH";
  const allowedTrackOptions = useMemo(() => {
    if (profileTrack === "AHS") return [{ value: "AHS", label: "AHS" }] as const;
    if (profileTrack === "BHS") return [{ value: "BHS", label: "BHS" }] as const;
    return [{ value: "AHS", label: "AHS" }, { value: "BHS", label: "BHS" }, { value: "ALL", label: "Alle" }] as const;
  }, [profileTrack]);

  // Erlaubte Schulformen aus Profil ableiten
  const profileAllowedForms = useMemo((): Set<string> | null => {
    if (!teacherProfile?.allowedForms) return null;
    try { return new Set(JSON.parse(teacherProfile.allowedForms)); }
    catch { return null; }
  }, [teacherProfile]);

  // Form State – Startwert basierend auf Profil
  const [subjectId, setSubjectId] = useState("");
  const [schoolTrack, setSchoolTrack] = useState<TrackValue>("AHS");
  const [schoolForm, setSchoolForm] = useState<FormValue>("ALL");
  const [level, setLevel] = useState<LevelValue>("UNTERSTUFE");
  const [minGrade, setMinGrade] = useState(1);
  const [maxGrade, setMaxGrade] = useState(4);

  const loadAll = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    setMsg(null);

    try {
      const email = encodeURIComponent(session.user.email);

      const [mySubRes, offRes, profRes] = await Promise.all([
        fetch(`/api/teacher/my-subjects?email=${email}`, { cache: "no-store" }),
        fetch(`/api/teacher/offers?email=${email}`, { cache: "no-store" }),
        fetch(`/api/teacher/profile?email=${email}`, { cache: "no-store" }),
      ]);

      const mySubJson = await mySubRes.json().catch(() => ({}));
      const offJson = await offRes.json().catch(() => ({}));
      const profJson = await profRes.json().catch(() => ({}));

      const mySubjects: Subject[] = mySubJson.data || [];
      setAllSubjects(mySubjects);
      setOffers(offJson.data || []);
      const profile = profJson.data || null;
      setTeacherProfile(profile);

      // Initialen schoolTrack aus Profil setzen
      if (profile?.schoolTrack && profile.schoolTrack !== "BOTH") {
        setSchoolTrack(profile.schoolTrack as TrackValue);
        if (profile.schoolTrack === "BHS") setLevel("OBERSTUFE");
      }

      if (mySubjects.length > 0) {
        setSubjectId((prev) =>
          mySubjects.find((s) => s.id === prev) ? prev : mySubjects[0].id
        );
      } else {
        setSubjectId("");
      }
    } catch (e: any) {
      setMsg(e?.message || "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") loadAll();
  }, [status, loadAll]);

  // allSubjects already contains only this teacher's subjects (from /api/teacher/my-subjects)
  const allowedSubjects = allSubjects;

  // Track Optionen: basierend auf Profil + unterstufeOnly
  const trackOptions = useMemo(() => {
    if (unterstufeOnly) return SCHOOL_TRACKS.filter((x) => x.value === "AHS");
    return allowedTrackOptions as unknown as typeof SCHOOL_TRACKS;
  }, [unterstufeOnly, allowedTrackOptions]);

  // Level Optionen: BHS => nur Oberstufe; UnterstufeOnly => kein Ober/ALL
  const levelOptions = useMemo(() => {
    const base = [
      { value: "UNTERSTUFE" as const, label: "Unterstufe", disabled: false },
      { value: "OBERSTUFE" as const, label: "Oberstufe", disabled: unterstufeOnly },
      { value: "ALL" as const, label: "Alle", disabled: unterstufeOnly },
    ];

    if (schoolTrack === "BHS") {
      return base.map((x) =>
        x.value === "OBERSTUFE" ? { ...x, disabled: false } : { ...x, disabled: true }
      );
    }
    return base;
  }, [unterstufeOnly, schoolTrack]);

  // BHS => Level automatisch Oberstufe
  useEffect(() => {
    if (schoolTrack === "BHS" && level !== "OBERSTUFE") setLevel("OBERSTUFE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolTrack]);

  // UnterstufeOnly => harte Korrektur
  useEffect(() => {
    if (!unterstufeOnly) return;
    if (schoolTrack === "BHS" || schoolTrack === "ALL") setSchoolTrack("AHS");
    if (level === "OBERSTUFE" || level === "ALL") setLevel("UNTERSTUFE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unterstufeOnly]);

  // Form Optionen: gefiltert nach erlaubten Formen aus Profil
  const formOptions = useMemo(() => {
    let base: { value: string; label: string }[] = [];
    if (schoolTrack === "ALL" || schoolTrack === "AHS") {
      base.push(...SCHOOL_FORMS.AHS.filter((x) => x.value !== "ALL"));
    }
    if (schoolTrack === "ALL" || schoolTrack === "BHS") {
      base.push(...SCHOOL_FORMS.BHS.filter((x) => x.value !== "ALL"));
    }
    // Auf erlaubte Formen einschraenken falls im Profil gesetzt
    if (profileAllowedForms) {
      base = base.filter((x) => profileAllowedForms.has(x.value));
    }
    return [{ value: "ALL", label: "Alle" }, ...base];
  }, [schoolTrack, profileAllowedForms]);

  // Range automatisch clampen bei Änderungen
  useEffect(() => {
    const r = gradeRangeFor(schoolTrack, level);
    const safeMin = clamp(minGrade, r.min, r.max);
    const safeMax = clamp(maxGrade, r.min, r.max);
    const finalMin = Math.min(safeMin, safeMax);
    const finalMax = Math.max(safeMin, safeMax);

    const minOut = minGrade < r.min || minGrade > r.max;
    const maxOut = maxGrade < r.min || maxGrade > r.max;

    if (minOut && maxOut) {
      setMinGrade(r.min);
      setMaxGrade(r.max);
    } else {
      setMinGrade(finalMin);
      setMaxGrade(finalMax);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolTrack, level]);

  async function createOffer() {
    if (!session?.user?.email) return;
    setMsg(null);

    if (!subjectId) {
      setMsg("Bitte ein Fach auswählen.");
      return;
    }

    const res = await fetch("/api/teacher/offers/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        subjectId,
        schoolTrack,
        schoolForm,
        level,
        minGrade,
        maxGrade,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || `Fehler ${res.status}`);
      return;
    }

    setMsg(`✅ Angebot(e) hinzugefügt: ${json?.createdCount ?? "?"}`);
    await loadAll();
  }

  // ✅ EINZELNES Angebot löschen (NICHT Teacher.subject!)
  async function deleteOfferById(offerId: string) {
    setMsg(null);

    const res = await fetch("/api/teacher/offers/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || `Fehler ${res.status}`);
      return;
    }

    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    setMsg("✅ Angebot gelöscht");
  }

  const range = gradeRangeFor(schoolTrack, level);
  const profileComplete =
    !!teacherProfile?.address?.trim() && !!teacherProfile?.taxNumber?.trim();

  if (status === "loading") {
    return <main className="min-h-screen bg-gray-50 px-6 py-10">Lade…</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Meine Fächer</h1>
        <p className="text-gray-600 mb-6">
          Lege fest, welche Fächer du für welche Schulformen und Klassen unterrichtest.
        </p>

        {!loading && !profileComplete && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
            <p className="font-semibold text-amber-800 mb-1">Profil unvollständig</p>
            <p className="text-sm text-amber-700 mb-3">
              Bevor du Unterrichtsangebote erstellen kannst, musst du im Profil deine{" "}
              <strong>Adresse</strong> und deine <strong>Steuernummer / UID</strong> hinterlegen.
              Diese Angaben werden für korrekte Gutschriften benötigt.
            </p>
            <a
              href="/teacher/profile"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Profil vervollständigen →
            </a>
          </div>
        )}

        {unterstufeOnly && (
          <p className="mb-4 text-sm text-blue-700">
            Hinweis: Dein Profil ist auf <strong>nur Unterstufe</strong> eingestellt. Daher sind{" "}
            <strong>BHS</strong> und <strong>Oberstufe</strong> deaktiviert.
          </p>
        )}

        {msg && (
          <p className={`mb-4 text-sm ${msg.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
            {msg}
          </p>
        )}

        {/* Formular */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8">
          <h2 className="font-semibold mb-1">Neues Angebot hinzufügen</h2>
          <p className="text-xs text-gray-500 mb-4">
            Du kannst nur Fächer auswählen, die in deinem Profil hinterlegt sind. Wenn du weitere Fächer anbieten möchtest, melde dich bei uns:{" "}
            <span className="font-medium text-blue-700 select-all">office.lerneasy@gmail.com</span>
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Fach</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={allowedSubjects.length === 0}
              >
                {allowedSubjects.length === 0 ? (
                  <option value="">Keine Fächer hinterlegt – bitte Admin kontaktieren</option>
                ) : (
                  allowedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Schultyp</label>
              <select
                value={schoolTrack}
                onChange={(e) => setSchoolTrack(e.target.value as TrackValue)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {trackOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {schoolTrack === "BHS" && (
                <p className="text-xs text-gray-500 mt-1">
                  BHS ist automatisch Oberstufe (Klasse 5–9).
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Schulform</label>
              <select
                value={schoolForm}
                onChange={(e) => setSchoolForm(e.target.value as FormValue)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {formOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                „Alle“ erstellt mehrere einzelne Angebote (pro Schulform).
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Stufe</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelValue)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {levelOptions.map((l) => (
                  <option key={l.value} value={l.value} disabled={!!l.disabled}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                „Alle“ erstellt bei AHS automatisch Unterstufe + Oberstufe.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Klasse von (erlaubt: {range.min}–{range.max})
              </label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                value={minGrade}
                onChange={(e) => setMinGrade(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Klasse bis (erlaubt: {range.min}–{range.max})
              </label>
              <input
                type="number"
                min={range.min}
                max={range.max}
                value={maxGrade}
                onChange={(e) => setMaxGrade(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={createOffer}
            disabled={loading || allowedSubjects.length === 0 || !profileComplete}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-60"
            title={!profileComplete ? "Bitte zuerst Adresse und Steuernummer im Profil hinterlegen." : undefined}
          >
            Angebot hinzufügen
          </button>
        </div>

        {/* ✅ Liste: jedes Angebot eigenes Fenster */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Meine Angebote</h2>

          {loading && <p className="text-gray-500">Lade…</p>}

          {!loading && offers.length === 0 && (
            <p className="text-gray-500">Noch keine Angebote angelegt.</p>
          )}

          <div className="space-y-3">
            {offers.map((o) => (
              <div key={o.id} className="flex items-start justify-between border rounded-xl p-4">
                <div className="space-y-1">
                  <div className="font-semibold">{o.subject.name}</div>
                  <div className="text-sm text-gray-700">
                    {o.schoolTrack} · {LABEL_FORM[o.schoolForm] || o.schoolForm} · {levelLabel(o.level)} ·
                    Klasse {o.minGrade}–{o.maxGrade}
                  </div>
                </div>

                <button
                  onClick={() => deleteOfferById(o.id)}
                  className="text-red-600 hover:underline font-medium"
                >
                  Angebot löschen
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Hinweis: Hier wird nur das Angebot gelöscht – deine Lehrer-Fächerliste (Teacher.subject) bleibt unverändert.
          </p>
        </div>
      </div>
    </main>
  );
}

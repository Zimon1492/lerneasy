"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type SchoolTrack = "AHS" | "BHS" | "BOTH";
type LevelPref = "UNTERSTUFE" | "OBERSTUFE" | "BOTH";

const AHS_FORMS = [
  { value: "AHS_GYMNASIUM", label: "Gymnasium" },
  { value: "AHS_REALGYMNASIUM", label: "Realgymnasium" },
  { value: "AHS_WK_REALGYMNASIUM", label: "Wirtschaftsk. Realgymnasium" },
  { value: "AHS_BORG", label: "BORG" },
  { value: "AHS_SCHWERPUNKT", label: "AHS mit Schwerpunkt" },
];

const BHS_FORMS = [
  { value: "BHS_HTL", label: "HTL" },
  { value: "BHS_HAK", label: "HAK" },
  { value: "BHS_HLW", label: "HLW / HWS" },
  { value: "BHS_MODE", label: "HLA Mode" },
  { value: "BHS_KUNST_GESTALTUNG", label: "HLA Kunst & Gestaltung" },
  { value: "BHS_TOURISMUS", label: "HLA Tourismus" },
  { value: "BHS_SOZIALPAED", label: "Sozialpaedagogik" },
  { value: "BHS_LAND_FORST", label: "Land- & Forstwirtschaft" },
];

function NewTeacherForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [schoolTrack, setSchoolTrack] = useState<SchoolTrack>("BOTH");
  const [levelPref, setLevelPref] = useState<LevelPref>("BOTH");
  const [allAhs, setAllAhs] = useState(true);
  const [allBhs, setAllBhs] = useState(true);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params) return;
    setName(params.get("name") ?? "");
    setEmail(params.get("email") ?? "");
    setSubject(params.get("subject") ?? "");

    const track = (params.get("schoolTrack") ?? "BOTH") as SchoolTrack;
    const level = (params.get("levelPref") ?? "BOTH") as LevelPref;
    setSchoolTrack(track);
    setLevelPref(track === "BHS" ? "OBERSTUFE" : level);

    // Schulformen aus URL lesen
    const formsParam = params.get("schoolForms");
    if (formsParam) {
      try {
        const forms: string[] = JSON.parse(formsParam);
        const ahsForms = AHS_FORMS.map((f) => f.value);
        const bhsForms = BHS_FORMS.map((f) => f.value);
        const hasAllAhs = ahsForms.every((f) => forms.includes(f));
        const hasAllBhs = bhsForms.every((f) => forms.includes(f));
        setAllAhs(hasAllAhs);
        setAllBhs(hasAllBhs);
        if (!hasAllAhs || !hasAllBhs) {
          setSelectedForms(new Set(forms));
        }
      } catch { }
    }
  }, [params]);

  function onTrackChange(v: SchoolTrack) {
    setSchoolTrack(v);
    if (v === "BHS") setLevelPref("OBERSTUFE");
    setSelectedForms(new Set());
    setAllAhs(true);
    setAllBhs(true);
  }

  function toggleForm(value: string) {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function toggleAllAhs(checked: boolean) {
    setAllAhs(checked);
    if (checked) {
      setSelectedForms((prev) => {
        const next = new Set(prev);
        AHS_FORMS.forEach((f) => next.delete(f.value));
        return next;
      });
    }
  }

  function toggleAllBhs(checked: boolean) {
    setAllBhs(checked);
    if (checked) {
      setSelectedForms((prev) => {
        const next = new Set(prev);
        BHS_FORMS.forEach((f) => next.delete(f.value));
        return next;
      });
    }
  }

  // unterstufeOnly = true nur wenn Lehrer ausschliesslich AHS Unterstufe unterrichtet
  const unterstufeOnly = levelPref === "UNTERSTUFE" && schoolTrack === "AHS";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Erlaubte Schulformen berechnen
    const forms: string[] = [];
    if (showAhs) {
      if (allAhs) forms.push(...AHS_FORMS.map((f) => f.value));
      else forms.push(...AHS_FORMS.filter((f) => selectedForms.has(f.value)).map((f) => f.value));
    }
    if (showBhs) {
      if (allBhs) forms.push(...BHS_FORMS.map((f) => f.value));
      else forms.push(...BHS_FORMS.filter((f) => selectedForms.has(f.value)).map((f) => f.value));
    }

    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        subject,
        unterstufeOnly,
        schoolTrack,
        allowedForms: forms,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Serverfehler");
      return;
    }

    router.push("/admin/teachers");
  }

  const showAhs = schoolTrack === "AHS" || schoolTrack === "BOTH";
  const showBhs = schoolTrack === "BHS" || schoolTrack === "BOTH";
  const fromApplication = !!(params.get("name") || params.get("email"));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/teachers" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Zurueck zur Lehrerliste
        </Link>
        <h1 className="text-2xl font-bold mt-2">Neuen Lehrer anlegen</h1>
        <p className="text-sm text-gray-500 mt-1">
          Der Lehrer bekommt automatisch eine E-Mail mit einem Link zum Passwort festlegen.
        </p>
      </div>

      {fromApplication && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 text-sm">
          Daten aus Bewerbung vorausgefuellt – du kannst alles noch anpassen.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        {/* Basisdaten */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">E-Mail *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="lehrer@example.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Fach / Faecher *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="z.B. Mathematik, Englisch"
          />
          <p className="text-xs text-gray-400 mt-1">Mehrere Faecher mit Komma trennen</p>
        </div>

        {/* Schultyp + Stufe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Schultyp</label>
            <select
              value={schoolTrack}
              onChange={(e) => onTrackChange(e.target.value as SchoolTrack)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="BOTH">AHS &amp; BHS</option>
              <option value="AHS">Nur AHS</option>
              <option value="BHS">Nur BHS</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Schulstufe</label>
            <select
              value={levelPref}
              onChange={(e) => setLevelPref(e.target.value as LevelPref)}
              disabled={schoolTrack === "BHS"}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-60 disabled:bg-gray-100"
            >
              {schoolTrack !== "BHS" && <option value="BOTH">Unter- &amp; Oberstufe</option>}
              {schoolTrack !== "BHS" && <option value="UNTERSTUFE">Nur Unterstufe (Kl. 1-4)</option>}
              <option value="OBERSTUFE">
                {schoolTrack === "BHS" ? "Oberstufe (Kl. 5-9)" : "Nur Oberstufe (Kl. 5+)"}
              </option>
            </select>
            {schoolTrack === "BHS" && (
              <p className="text-xs text-gray-400 mt-1">BHS hat keine Unterstufe</p>
            )}
          </div>
        </div>

        {/* Schulformen */}
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Erlaubte Schulformen</p>

          {showAhs && (
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allAhs}
                  onChange={(e) => toggleAllAhs(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-blue-700">Alle AHS-Formen</span>
              </label>
              {!allAhs && (
                <div className="ml-6 grid grid-cols-2 gap-1">
                  {AHS_FORMS.map((f) => (
                    <label key={f.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedForms.has(f.value)}
                        onChange={() => toggleForm(f.value)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs">{f.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {showBhs && (
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allBhs}
                  onChange={(e) => toggleAllBhs(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-green-700">Alle BHS-Formen</span>
              </label>
              {!allBhs && (
                <div className="ml-6 grid grid-cols-2 gap-1">
                  {BHS_FORMS.map((f) => (
                    <label key={f.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedForms.has(f.value)}
                        onChange={() => toggleForm(f.value)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs">{f.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zusammenfassung */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-medium">Einschraenkung: </span>
          {unterstufeOnly
            ? "Nur AHS Unterstufe (Klasse 1-4)"
            : schoolTrack === "BHS"
            ? "Nur BHS Oberstufe (Klasse 5-9)"
            : levelPref === "UNTERSTUFE"
            ? "Unterstufe (AHS + BHS falls gewaehlt)"
            : levelPref === "OBERSTUFE"
            ? "Nur Oberstufe"
            : "Alle Stufen (AHS + BHS)"}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Link href="/admin/teachers" className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Wird angelegt..." : "Lehrer anlegen & E-Mail senden"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewTeacherPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Lade...</div>}>
      <NewTeacherForm />
    </Suspense>
  );
}

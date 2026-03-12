"use client";

import { useRef, useState, useEffect } from "react";

type SchoolTrack = "AHS" | "BHS" | "BOTH";
type LevelPref  = "UNTERSTUFE" | "OBERSTUFE" | "BOTH";

const AHS_FORMS = [
  { value: "AHS_GYMNASIUM",        label: "Gymnasium" },
  { value: "AHS_REALGYMNASIUM",    label: "Realgymnasium" },
  { value: "AHS_WK_REALGYMNASIUM", label: "Wirtschaftsk. Realgymnasium" },
  { value: "AHS_BORG",             label: "BORG" },
  { value: "AHS_SCHWERPUNKT",      label: "AHS mit Schwerpunkt" },
];

const BHS_FORMS = [
  { value: "BHS_HTL",          label: "HTL" },
  { value: "BHS_HAK",          label: "HAK" },
  { value: "BHS_HLW",          label: "HLW / HWS" },
  { value: "BHS_MODE",         label: "HLA Mode" },
  { value: "BHS_KUNST_GESTALTUNG", label: "HLA Kunst & Gestaltung" },
  { value: "BHS_TOURISMUS",    label: "HLA Tourismus" },
  { value: "BHS_SOZIALPAED",   label: "Sozialpaedagogik" },
  { value: "BHS_LAND_FORST",   label: "Land- & Forstwirtschaft" },
];

// ─── Fach-Picker ─────────────────────────────────────────────────────────────

function SubjectPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (subjects: string[]) => void;
}) {
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [query, setQuery]             = useState("");
  const [open, setOpen]               = useState(false);
  const containerRef                  = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  // Fächer von der API laden
  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((data) => {
        const names: string[] = (data.data ?? []).map((s: { name: string }) => s.name);
        setAllSubjects(names);
      })
      .catch(() => {});
  }, []);

  // Klick außerhalb → Dropdown schließen
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = allSubjects.filter(
    (s) =>
      !selected.includes(s) &&
      s.toLowerCase().includes(query.toLowerCase())
  );

  function add(name: string) {
    onChange([...selected, name]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(name: string) {
    onChange(selected.filter((s) => s !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) add(suggestions[0]);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Tags + Eingabe */}
      <div
        className={`flex flex-wrap gap-1.5 min-h-[42px] w-full border rounded p-2 bg-white cursor-text transition ${
          open ? "ring-2 ring-blue-400 border-blue-400" : "border-gray-300"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
          >
            {name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(name); }}
              className="text-blue-500 hover:text-blue-800 leading-none"
              aria-label={`${name} entfernen`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? "Fach suchen und auswählen..." : ""}
          className="flex-1 min-w-[140px] outline-none text-sm bg-transparent"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">
              {query ? "Kein passendes Fach gefunden." : "Alle verfügbaren Fächer ausgewählt."}
            </div>
          ) : (
            suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(name); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition"
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 mt-1">
        Tippe um zu suchen · Enter oder anklicken zum Auswählen · Backspace zum Entfernen
      </p>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function TeacherApplySection() {
  const [loading, setLoading]               = useState(false);
  const [ok, setOk]                         = useState<string | null>(null);
  const [err, setErr]                       = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [schoolTrack, setSchoolTrack]       = useState<SchoolTrack>("BOTH");
  const [levelPref, setLevelPref]           = useState<LevelPref>("BOTH");
  const [selectedForms, setSelectedForms]   = useState<Set<string>>(new Set());
  const [allAhs, setAllAhs]                 = useState(false);
  const [allBhs, setAllBhs]                 = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function onTrackChange(v: SchoolTrack) {
    setSchoolTrack(v);
    if (v === "BHS") setLevelPref("OBERSTUFE");
    setSelectedForms(new Set());
    setAllAhs(false);
    setAllBhs(false);
  }

  function toggleForm(value: string) {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
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

  function getSchoolForms(): string[] {
    const forms: string[] = [];
    if (schoolTrack === "AHS" || schoolTrack === "BOTH") {
      if (allAhs) forms.push(...AHS_FORMS.map((f) => f.value));
      else forms.push(...AHS_FORMS.filter((f) => selectedForms.has(f.value)).map((f) => f.value));
    }
    if (schoolTrack === "BHS" || schoolTrack === "BOTH") {
      if (allBhs) forms.push(...BHS_FORMS.map((f) => f.value));
      else forms.push(...BHS_FORMS.filter((f) => selectedForms.has(f.value)).map((f) => f.value));
    }
    return forms;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (selectedSubjects.length === 0) {
      setErr("Bitte wähle mindestens ein Fach aus.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("subject", selectedSubjects.join(", "));
      fd.set("schoolTrack", schoolTrack);
      fd.set("levelPref", levelPref);
      fd.set("schoolForms", JSON.stringify(getSchoolForms()));

      const res  = await fetch("/api/teachers/apply", { method: "POST", body: fd });
      const raw  = await res.text();
      let data: any = null;
      try { data = JSON.parse(raw); } catch { /* ignore */ }

      if (!res.ok) {
        setErr(data?.error || raw || `Fehler ${res.status}`);
        setLoading(false);
        return;
      }

      setOk("Bewerbung wurde erfolgreich gesendet – wir melden uns per E-Mail!");
      formRef.current?.reset();
      setSchoolTrack("BOTH");
      setLevelPref("BOTH");
      setSelectedForms(new Set());
      setAllAhs(false);
      setAllBhs(false);
      setSelectedSubjects([]);
    } catch (ex: any) {
      setErr(`Netzwerkfehler: ${ex?.message || ex}`);
    }
    setLoading(false);
  }

  const showAhs = schoolTrack === "AHS" || schoolTrack === "BOTH";
  const showBhs = schoolTrack === "BHS" || schoolTrack === "BOTH";

  return (
    <section className="bg-blue-50 border-t">
      <div className="mx-auto max-w-5xl px-6 md:px-10 py-16 grid md:grid-cols-2 gap-10 items-start">

        {/* Linke Seite */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Bewirb dich als Lehrer</h2>
          <p className="text-gray-700">
            Sende uns dein Bewerbungsschreiben und lade dein letztes Zeugnis (PDF) hoch.
            Nach dem Absenden erhalten wir automatisch eine E-Mail.
          </p>
          <ul className="text-gray-700 space-y-1">
            <li>• Geprufte Lehrkraefte – schnelle Rueckmeldung</li>
            <li>• Flexible Zeiten, online &amp; vor Ort</li>
            <li>• Faecher frei waehlbar</li>
          </ul>
        </div>

        {/* Rechte Seite – Formular */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          {ok  && <div className="border border-green-300 bg-green-50 text-green-700 rounded p-2 text-sm">{ok}</div>}
          {err && <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">{err}</div>}

          <form ref={formRef} onSubmit={onSubmit} encType="multipart/form-data" className="space-y-4">

            <label className="block">
              <span className="text-sm font-medium">Name *</span>
              <input name="name" required className="mt-1 w-full border rounded p-2" placeholder="Erika Mustermann" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">E-Mail *</span>
              <input type="email" name="email" required className="mt-1 w-full border rounded p-2" placeholder="max@mail.com" />
            </label>

            {/* Fach-Picker */}
            <div>
              <span className="text-sm font-medium">Fach / Fächer *</span>
              <div className="mt-1">
                <SubjectPicker
                  selected={selectedSubjects}
                  onChange={setSelectedSubjects}
                />
              </div>
            </div>

            {/* Schultyp + Stufe */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium">Schultyp *</span>
                <select
                  value={schoolTrack}
                  onChange={(e) => onTrackChange(e.target.value as SchoolTrack)}
                  className="mt-1 w-full border rounded p-2 bg-white"
                >
                  <option value="BOTH">AHS &amp; BHS</option>
                  <option value="AHS">Nur AHS</option>
                  <option value="BHS">Nur BHS</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Schulstufe *</span>
                <select
                  value={levelPref}
                  onChange={(e) => setLevelPref(e.target.value as LevelPref)}
                  disabled={schoolTrack === "BHS"}
                  className="mt-1 w-full border rounded p-2 bg-white disabled:opacity-60 disabled:bg-gray-100"
                >
                  {schoolTrack !== "BHS" && <option value="BOTH">Unter- &amp; Oberstufe</option>}
                  {schoolTrack !== "BHS" && <option value="UNTERSTUFE">Nur Unterstufe (Kl. 1-4)</option>}
                  <option value="OBERSTUFE">
                    {schoolTrack === "BHS" ? "Oberstufe (Kl. 5-9)" : "Nur Oberstufe (Kl. 5+)"}
                  </option>
                </select>
                {schoolTrack === "BHS" && (
                  <span className="text-xs text-gray-500 mt-1 block">BHS hat keine Unterstufe</span>
                )}
              </label>
            </div>

            {/* Schulformen */}
            <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
              <span className="text-sm font-medium">Schulformen *</span>

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

            <label className="block">
              <span className="text-sm font-medium">Bewerbungsschreiben *</span>
              <textarea
                name="letter"
                required
                rows={4}
                className="mt-1 w-full border rounded p-2"
                placeholder="Warum moechtest du unterrichten? Welche Erfahrungen bringst du mit?"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Zeugnis / Lebenslauf (PDF) *</span>
              <input type="file" name="file" accept="application/pdf" required className="mt-1 w-full" />
              <span className="text-xs text-gray-500">Nur PDF, max. 10 MB.</span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
              />
              <span className="text-sm text-gray-600">
                Ich habe die{" "}
                <a href="/datenschutz" target="_blank" className="text-blue-600 underline">
                  Datenschutzerklärung
                </a>{" "}
                gelesen und akzeptiere sie.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !privacyAccepted}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Wird gesendet ..." : "Bewerbung absenden"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

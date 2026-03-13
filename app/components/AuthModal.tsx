"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = { onClose: () => void };

type SchoolTrack = "AHS" | "BHS";
type SchoolLevel = "UNTERSTUFE" | "OBERSTUFE";

const SCHOOL_FORMS: Record<SchoolTrack, { value: string; label: string }[]> = {
  AHS: [
    { value: "AHS_GYMNASIUM", label: "Gymnasium / Klassisches Gymnasium" },
    { value: "AHS_REALGYMNASIUM", label: "Realgymnasium" },
    { value: "AHS_WK_REALGYMNASIUM", label: "Wirtschaftsk. Realgymnasium" },
    { value: "AHS_BORG", label: "BORG (Oberstufenrealgymnasium)" },
    { value: "AHS_SCHWERPUNKT", label: "AHS mit Schwerpunkt" },
  ],
  BHS: [
    { value: "BHS_HTL", label: "HTL" },
    { value: "BHS_HAK", label: "HAK" },
    { value: "BHS_HLW", label: "HLW / HWS" },
    { value: "BHS_MODE", label: "HLA Mode" },
    { value: "BHS_KUNST_GESTALTUNG", label: "HLA Kunst & Gestaltung" },
    { value: "BHS_TOURISMUS", label: "HLA Tourismus" },
    { value: "BHS_SOZIALPAED", label: "Sozial-/Elementarpaedagogik" },
    { value: "BHS_LAND_FORST", label: "Land- & Forstwirtschaft" },
  ],
};

function gradeOptions(level: SchoolLevel, track: SchoolTrack) {
  if (track === "BHS") return [5, 6, 7, 8, 9];
  if (level === "UNTERSTUFE") return [1, 2, 3, 4];
  return [5, 6, 7, 8];
}

export default function AuthModal({ onClose }: Props) {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [schoolTrack, setSchoolTrack] = useState<SchoolTrack>("AHS");
  const formOptions = useMemo(() => SCHOOL_FORMS[schoolTrack], [schoolTrack]);
  const [schoolForm, setSchoolForm] = useState<string>(SCHOOL_FORMS.AHS[0].value);
  const [schoolName, setSchoolName] = useState("");
  const [level, setLevel] = useState<SchoolLevel>("UNTERSTUFE");
  const gradeList = useMemo(() => gradeOptions(level, schoolTrack), [level, schoolTrack]);
  const [grade, setGrade] = useState<number>(gradeList[0]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const switchTo = (m: "login" | "register") => {
    setMode(m);
    setMsg(null);
  };

  function onTrackChange(v: SchoolTrack) {
    setSchoolTrack(v);
    const first = SCHOOL_FORMS[v][0]?.value || "";
    setSchoolForm(first);
    const newLevel: SchoolLevel = v === "BHS" ? "OBERSTUFE" : level;
    if (v === "BHS") setLevel("OBERSTUFE");
    const grades = gradeOptions(newLevel, v);
    setGrade(grades[0]);
  }

  function onLevelChange(v: SchoolLevel) {
    setLevel(v);
    const grades = gradeOptions(v, schoolTrack);
    setGrade(grades[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            schoolTrack,
            schoolForm,
            schoolName,
            level,
            grade,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Registrierung fehlgeschlagen");

        // E-Mail-Bestätigung erforderlich — kein Auto-Login
        setMsg("✅ Konto erstellt! Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link geschickt.");
        return;
      } else {
        const result = await signIn("student-credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.ok) {
          onClose();
          router.push("/student/dashboard");
          return;
        }
        if (result?.error === "EMAIL_NOT_VERIFIED") {
          setMsg("❌ Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in deinem Postfach.");
        } else {
          setMsg("E-Mail oder Passwort ist falsch");
        }
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-[92%] max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Modal schliessen"
        >
          X
        </button>

        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 font-semibold ${
              mode === "register"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => switchTo("register")}
            type="button"
          >
            Registrieren
          </button>
          <button
            className={`flex-1 py-2 font-semibold ${
              mode === "login"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => switchTo("login")}
            type="button"
          >
            Anmelden
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Schultyp</label>
                <select
                  value={schoolTrack}
                  onChange={(e) => onTrackChange(e.target.value as SchoolTrack)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="AHS">AHS</option>
                  <option value="BHS">BHS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Schulform</label>
                <select
                  value={schoolForm}
                  onChange={(e) => setSchoolForm(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {formOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Schulname</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="z.B. HTL Salzburg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Stufe</label>
                  <select
                    value={level}
                    onChange={(e) => onLevelChange(e.target.value as SchoolLevel)}
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={schoolTrack === "BHS"}
                  >
                    {schoolTrack !== "BHS" && (
                      <option value="UNTERSTUFE">Unterstufe (1.-4. Klasse)</option>
                    )}
                    <option value="OBERSTUFE">
                      {schoolTrack === "BHS"
                        ? "Oberstufe (5.-9. Jahrgang)"
                        : "Oberstufe (5.-8. Klasse)"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Klasse</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {gradeList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="max@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>

          {msg && (
            <p
              className={`text-sm ${
                /fehler|falsch|existiert|ungueltig|failed/i.test(msg)
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading
              ? "Bitte warten..."
              : mode === "login"
              ? "Einloggen"
              : "Konto erstellen & einloggen"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button
                onClick={() => switchTo("register")}
                className="text-blue-600 hover:underline font-medium"
                type="button"
              >
                Registrieren
              </button>
            </>
          ) : (
            <>
              Schon registriert?{" "}
              <button
                onClick={() => switchTo("login")}
                className="text-blue-600 hover:underline font-medium"
                type="button"
              >
                Anmelden
              </button>
            </>
          )}
        </p>

        {mode === "login" && (
          <p className="text-center text-sm text-gray-500 mt-1">
            <a href="/student/forgot-password" className="text-blue-600 hover:underline">
              Passwort vergessen?
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

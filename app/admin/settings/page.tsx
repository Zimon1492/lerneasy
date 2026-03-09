"use client";

import { useEffect, useState } from "react";

type PendingSettings = {
  priceMin: number;
  priceMax: number;
  priceN: number;
  teacherShare: number;
  effectiveFrom: string;
};

type FullSettings = {
  priceMin: number;
  priceMax: number;
  priceN: number;
  teacherShare: number;
  pending: PendingSettings | null;
};

const DEFAULTS: FullSettings = {
  priceMin: 25, priceMax: 45, priceN: 15, teacherShare: 0.7, pending: null,
};

function calcPrice(x: number, a: number, o: number, m: number, n: number): number {
  const raw = o + (m - o) * (1 - Math.exp(-x / n)) * (a / 5);
  return Math.round(raw * 100) / 100;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminSettingsPage() {
  const [loaded, setLoaded] = useState<FullSettings>(DEFAULTS);
  const [form, setForm] = useState({ priceMin: 25, priceMax: 45, priceN: 15, teacherSharePct: 70 });
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<{ studentsSent: number; teachersSent: number; studentEffectiveDate: string; teacherEffectiveDate: string } | null>(null);
  const [planMsg, setPlanMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function loadSettings() {
    setLoading(true);
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: FullSettings) => {
        setLoaded(s);
        setForm({
          priceMin: s.priceMin,
          priceMax: s.priceMax,
          priceN: s.priceN,
          teacherSharePct: Math.round(s.teacherShare * 100),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadSettings(); }, []);

  // "Benachrichtigen & planen" – Kern-Workflow
  async function handlePlanAndNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(
      `E-Mails an alle Schüler (2 Monate Vorlauf) und Lehrer (4 Wochen Vorlauf) senden?\n\n` +
      `Neue Werte: o=${form.priceMin}, m=${form.priceMax}, n=${form.priceN}, p=${form.teacherSharePct}%\n\n` +
      `Dieser Vorgang kann nicht rückgängig gemacht werden.`
    )) return;

    setPlanning(true);
    setPlanResult(null);
    setPlanMsg(null);
    try {
      const res = await fetch("/api/admin/notify-agb-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceMin: form.priceMin,
          priceMax: form.priceMax,
          priceN: form.priceN,
          teacherShare: form.teacherSharePct / 100,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlanResult(json);
        setPlanMsg({ type: "success", text: "E-Mails gesendet. Neue Werte sind ab dem Stichtag aktiv." });
        loadSettings(); // Reload to show pending values
      } else {
        setPlanMsg({ type: "error", text: json?.error ?? "Fehler beim E-Mail-Versand." });
      }
    } catch {
      setPlanMsg({ type: "error", text: "Netzwerkfehler beim E-Mail-Versand." });
    } finally {
      setPlanning(false);
    }
  }

  // "Sofort anwenden" – nur für Ersteinrichtung / Korrekturen
  async function handleImmediateSave() {
    if (!confirm(
      `Werte SOFORT anwenden (ohne E-Mail-Benachrichtigung)?\n\n` +
      `Neue Werte: o=${form.priceMin}, m=${form.priceMax}, n=${form.priceN}, p=${form.teacherSharePct}%\n\n` +
      `Nur für Ersteinrichtung oder Korrekturen ohne Nutzerauswirkung verwenden.`
    )) return;

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceMin: form.priceMin,
          priceMax: form.priceMax,
          priceN: form.priceN,
          teacherShare: form.teacherSharePct / 100,
          immediate: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({ type: "error", text: json?.error ?? "Fehler beim Speichern." });
      } else {
        setSaveMsg({ type: "success", text: "Einstellungen sofort angewendet." });
        loadSettings();
      }
    } catch {
      setSaveMsg({ type: "error", text: "Netzwerkfehler." });
    } finally {
      setSaving(false);
    }
  }

  const { priceMin: o, priceMax: m, priceN: n } = form;

  const exampleRows = [
    { x: 0,   label: "0 (neu)" },
    { x: 5,   label: "5" },
    { x: 15,  label: "15" },
    { x: 30,  label: "30" },
    { x: 100, label: "∞ (≈100)" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preiseinstellungen</h1>
          <p className="text-sm text-gray-500 mt-1">Konfiguriere die dynamische Preisformel und den Lehreranteil.</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Lade Einstellungen...</p>
        ) : (
          <>
            {/* Aktuelle Werte */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
              <h2 className="font-semibold text-sm text-gray-700 mb-2">Aktuell aktive Werte</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 block">o (Start)</span>
                  <span className="font-mono font-semibold">{loaded.priceMin} €</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 block">m (Max)</span>
                  <span className="font-mono font-semibold">{loaded.priceMax} €</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 block">n (Wachstum)</span>
                  <span className="font-mono font-semibold">{loaded.priceN}</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 block">p (Lehreranteil)</span>
                  <span className="font-mono font-semibold">{Math.round(loaded.teacherShare * 100)} %</span>
                </div>
              </div>
            </div>

            {/* Geplante Änderung (Pending) */}
            {loaded.pending && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl mt-0.5">⏳</span>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800 text-sm">
                      Geplante Änderung – tritt am {formatDate(loaded.pending.effectiveFrom)} in Kraft
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Nutzer wurden per E-Mail informiert. Die alten Werte gelten bis zum Stichtag.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                      <div className="bg-blue-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-blue-400 block">o (Start)</span>
                        <span className="font-mono font-semibold text-blue-900">{loaded.pending.priceMin} €</span>
                      </div>
                      <div className="bg-blue-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-blue-400 block">m (Max)</span>
                        <span className="font-mono font-semibold text-blue-900">{loaded.pending.priceMax} €</span>
                      </div>
                      <div className="bg-blue-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-blue-400 block">n (Wachstum)</span>
                        <span className="font-mono font-semibold text-blue-900">{loaded.pending.priceN}</span>
                      </div>
                      <div className="bg-blue-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-blue-400 block">p (Lehreranteil)</span>
                        <span className="font-mono font-semibold text-blue-900">{Math.round(loaded.pending.teacherShare * 100)} %</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Formular */}
            <form onSubmit={handlePlanAndNotify} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-base text-gray-800">Neue Werte eingeben</h2>
                <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mt-2">
                  f(x) = {o} + ({m} − {o}) × (1 − e<sup>−x/{n}</sup>) × a/5
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    o – Startpreis (€/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.priceMin}
                    onChange={(e) => setForm((f) => ({ ...f, priceMin: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Preis für neue Lehrkräfte ohne Bewertungen.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    m – Maximalpreis (€/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.priceMax}
                    onChange={(e) => setForm((f) => ({ ...f, priceMax: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Asymptotischer Maximalpreis bei x→∞, a=5.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    n – Wachstumskonstante
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={form.priceN}
                    onChange={(e) => setForm((f) => ({ ...f, priceN: parseFloat(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Höher = langsamer Anstieg.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    p – Lehreranteil (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="99"
                    value={form.teacherSharePct}
                    onChange={(e) => setForm((f) => ({ ...f, teacherSharePct: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Plattformanteil: {100 - form.teacherSharePct}%.</p>
                </div>
              </div>

              {planMsg && (
                <div className={`rounded-lg px-4 py-3 text-sm ${planMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {planMsg.text}
                </div>
              )}

              {planResult && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  <strong>E-Mails gesendet:</strong><br />
                  Schüler: {planResult.studentsSent} (Inkrafttreten: {planResult.studentEffectiveDate})<br />
                  Lehrer: {planResult.teachersSent} (Vorlauf: {planResult.teacherEffectiveDate})
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                {/* Sekundär: Sofort anwenden */}
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={handleImmediateSave}
                    disabled={saving}
                    className="text-xs text-gray-500 underline hover:text-gray-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Wird angewendet..." : "Sofort anwenden (ohne E-Mails)"}
                  </button>
                  <p className="text-xs text-gray-400">Nur für Ersteinrichtung / Korrekturen</p>
                  {saveMsg && (
                    <p className={`text-xs ${saveMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                      {saveMsg.text}
                    </p>
                  )}
                </div>

                {/* Primär: Benachrichtigen & planen */}
                <button
                  type="submit"
                  disabled={planning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {planning ? "Sende E-Mails..." : "Benachrichtigen & planen"}
                </button>
              </div>
            </form>

            {/* Beispielpreise */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-semibold text-base text-gray-800 mb-3">Beispielpreise (Live-Vorschau)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs">
                      <th className="text-left py-2 pr-4 font-medium">Bewertungen (x)</th>
                      <th className="text-right py-2 px-4 font-medium">Preis a=3 (€/h)</th>
                      <th className="text-right py-2 px-4 font-medium">Preis a=5 (€/h)</th>
                      <th className="text-right py-2 pl-4 font-medium">Lehreranteil a=3</th>
                      <th className="text-right py-2 pl-4 font-medium">Lehreranteil a=5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleRows.map(({ x, label }) => {
                      const p3 = calcPrice(x, 3, o, m, n);
                      const p5 = calcPrice(x, 5, o, m, n);
                      const share = form.teacherSharePct / 100;
                      return (
                        <tr key={x} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-600">{label}</td>
                          <td className="py-2 px-4 text-right font-mono">{p3.toFixed(2)} €</td>
                          <td className="py-2 px-4 text-right font-mono text-blue-700 font-semibold">{p5.toFixed(2)} €</td>
                          <td className="py-2 pl-4 text-right font-mono text-green-700">{(p3 * share).toFixed(2)} €</td>
                          <td className="py-2 pl-4 text-right font-mono text-green-700 font-semibold">{(p5 * share).toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

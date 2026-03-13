"use client";

import { useEffect, useState } from "react";

type Student = {
  id: string;
  name: string | null;
  email: string;
  schoolTrack: string | null;
  schoolForm: string | null;
  level: string | null;
  grade: number | null;
  emailVerified: string | null;
  createdAt: string;
  _count: { bookings: number };
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    schoolTrack: "", schoolForm: "", schoolName: "", level: "", grade: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/students", { cache: "no-store" });
    const json = await res.json();
    setStudents(json.students ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Schüler "${email}" wirklich löschen?`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error); return; }
    setShowModal(false);
    setForm({ name: "", email: "", password: "", schoolTrack: "", schoolForm: "", schoolName: "", level: "", grade: "" });
    load();
  }

  const filtered = students.filter((s) => {
    const matchesSearch =
      (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesVerified =
      verifiedFilter === "all" ||
      (verifiedFilter === "verified" && !!s.emailVerified) ||
      (verifiedFilter === "unverified" && !s.emailVerified);
    return matchesSearch && matchesVerified;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schüler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} gesamt</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
          />
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">Alle</option>
            <option value="verified">✅ Verifiziert</option>
            <option value="unverified">❌ Nicht verifiziert</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + Schüler hinzufügen
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Neuen Schüler anlegen</h2>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">{formError}</p>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Schulname (optional)</label>
                  <input
                    type="text"
                    value={form.schoolName}
                    onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="BG/BRG Musterstadt"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="schueler@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Passwort *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Schultyp</label>
                  <select
                    value={form.schoolTrack}
                    onChange={(e) => setForm({ ...form, schoolTrack: e.target.value, schoolForm: "", level: e.target.value === "BHS" ? "OBERSTUFE" : form.level, grade: "" })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— wählen —</option>
                    <option value="AHS">AHS</option>
                    <option value="BHS">BHS</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Schulform</label>
                  <select
                    value={form.schoolForm}
                    onChange={(e) => setForm({ ...form, schoolForm: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— wählen —</option>
                    {form.schoolTrack === "AHS" && <>
                      <option value="AHS_GYMNASIUM">Gymnasium</option>
                      <option value="AHS_REALGYMNASIUM">Realgymnasium</option>
                      <option value="AHS_WK_REALGYMNASIUM">WK-Realgymnasium</option>
                      <option value="AHS_BORG">BORG</option>
                      <option value="AHS_SCHWERPUNKT">Schwerpunkt-Gymnasium</option>
                    </>}
                    {form.schoolTrack === "BHS" && <>
                      <option value="BHS_HTL">HTL</option>
                      <option value="BHS_HAK">HAK</option>
                      <option value="BHS_HLW">HLW</option>
                      <option value="BHS_MODE">Mode & Design</option>
                      <option value="BHS_KUNST_GESTALTUNG">Kunst & Gestaltung</option>
                      <option value="BHS_TOURISMUS">Tourismus</option>
                      <option value="BHS_SOZIALPAED">Sozialpädagogik</option>
                      <option value="BHS_LAND_FORST">Land- & Forstwirtschaft</option>
                    </>}
                    {!form.schoolTrack && <option value="OTHER">Sonstige</option>}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Stufe</label>
                  <select
                    value={form.schoolTrack === "BHS" ? "OBERSTUFE" : form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value, grade: "" })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    disabled={form.schoolTrack === "BHS"}
                  >
                    <option value="">— wählen —</option>
                    {form.schoolTrack !== "BHS" && <option value="UNTERSTUFE">Unterstufe (1.–4. Klasse)</option>}
                    <option value="OBERSTUFE">
                      {form.schoolTrack === "BHS" ? "Oberstufe (5.–9. Jahrgang)" : "Oberstufe (5.–8. Klasse)"}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Klasse</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— wählen —</option>
                    {(form.schoolTrack === "BHS"
                      ? [5,6,7,8,9]
                      : form.level === "OBERSTUFE"
                        ? [5,6,7,8]
                        : [1,2,3,4]
                    ).map((g) => (
                      <option key={g} value={g}>{g}. Klasse</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); setForm({ name: "", email: "", password: "", schoolTrack: "", schoolForm: "", schoolName: "", level: "", grade: "" }); }}
                  className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Speichert..." : "Anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {loading && <p className="text-gray-400">Lade...</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">E-Mail</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Schule</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">E-Mail</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">Buchungen</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Registriert</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{s.name ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{s.email}</td>
                <td className="px-5 py-3 text-gray-600 text-xs">
                  {[s.schoolTrack, s.schoolForm, s.level, s.grade ? `${s.grade}. Klasse` : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  {s.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✅ Verifiziert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      ❌ Ausstehend
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">{s._count.bookings}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(s.createdAt).toLocaleDateString("de-AT")}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDelete(s.id, s.email)}
                    disabled={deletingId === s.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                  >
                    {deletingId === s.id ? "Lösche..." : "Löschen"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Keine Schüler gefunden.</p>
        )}
      </div>
    </div>
  );
}

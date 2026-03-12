"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  name: string;
  email: string;
  subject: string;
  mustChangePassword: boolean;
  _count: { bookings: number; availabilities: number };
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/teachers", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(`Fehler ${res.status}: ${json?.error ?? "Unbekannt"}`);
        setTeachers([]);
      } else {
        setTeachers(json.teachers ?? []);
      }
    } catch (e: any) {
      setError("Netzwerkfehler: " + e?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleResendLink(id: string) {
    setResendingId(id);
    setResendMsg(null);
    const res = await fetch(`/api/admin/teachers/${id}/resend-link`, { method: "POST" });
    setResendingId(null);
    if (res.ok) {
      setResendMsg("Link wurde erfolgreich neu gesendet.");
    } else {
      const d = await res.json();
      setResendMsg("Fehler: " + (d.error ?? res.status));
    }
  }

  function startEdit(t: Teacher) {
    setEditingId(t.id);
    setEditSubject(t.subject);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditSubject("");
  }

  async function saveSubject(id: string) {
    if (!editSubject.trim()) return;
    setSavingId(id);
    const res = await fetch(`/api/admin/teachers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: editSubject.trim() }),
    });
    setSavingId(null);
    if (!res.ok) {
      const d = await res.json();
      alert("Fehler: " + (d.error ?? res.status));
    } else {
      setEditingId(null);
      load();
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Lehrer "${name}" wirklich löschen? Alle zugehörigen Buchungen werden ebenfalls gelöscht.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert("Fehler beim Löschen: " + (json?.error ?? res.status));
    }
    setDeletingId(null);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lehrer</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teachers.length} gesamt</p>
        </div>
        <Link
          href="/admin/teachers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          + Neuer Lehrer
        </Link>
      </div>

      {resendMsg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${resendMsg.startsWith("Fehler") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {resendMsg}
        </div>
      )}

      {loading && <p className="text-gray-400">Lade...</p>}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
          {error.includes("401") && (
            <span> – <Link href="/admin/login" className="underline font-semibold">Bitte einloggen</Link></span>
          )}
        </div>
      )}

      {!loading && !error && teachers.length === 0 && (
        <p className="text-gray-500">Noch keine Lehrer angelegt.</p>
      )}

      {teachers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">E-Mail</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Fach</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Buchungen</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-gray-600">{t.email}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          placeholder="z.B. Mathematik, Englisch"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveSubject(t.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => saveSubject(t.id)}
                          disabled={savingId === t.id}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-40"
                        >
                          {savingId === t.id ? "..." : "✓"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-indigo-600 hover:underline"
                        onClick={() => startEdit(t)}
                        title="Klicken zum Bearbeiten"
                      >
                        {t.subject}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">{t._count.bookings}</td>
                  <td className="px-5 py-3 text-center">
                    {t.mustChangePassword ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                        PW nicht gesetzt
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        Aktiv
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    {editingId !== t.id && (
                      <button
                        onClick={() => startEdit(t)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Bearbeiten
                      </button>
                    )}
                    {t.mustChangePassword && (
                      <button
                        onClick={() => handleResendLink(t.id)}
                        disabled={resendingId === t.id}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                      >
                        {resendingId === t.id ? "Sendet..." : "Link senden"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      disabled={deletingId === t.id}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                    >
                      {deletingId === t.id ? "Lösche..." : "Löschen"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

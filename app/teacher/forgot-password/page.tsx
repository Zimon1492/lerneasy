"use client";

import { useState } from "react";
import Link from "next/link";

export default function TeacherForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/teacher/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error ?? "Fehler. Bitte versuche es erneut.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Passwort vergessen</h1>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
            Falls ein Lehrer-Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet. Bitte überprüfe deinen Posteingang.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, um dein Passwort zurückzusetzen.
            </p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail-Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {loading ? "Senden..." : "Link senden"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-500">
          <Link href="/auth/teacher/login" className="text-indigo-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}

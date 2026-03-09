"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Passwort muss mindestens 8 Zeichen haben."); return; }
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }

    setLoading(true); setError(null);
    const res = await fetch("/api/student/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error ?? "Fehler beim Speichern.");
    } else {
      setMsg("Passwort erfolgreich gesetzt! Du wirst zur Anmeldung weitergeleitet...");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
    setLoading(false);
  }

  if (!token) {
    return <p className="text-red-600">Ungültiger Link. Bitte fordere einen neuen an.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm w-full">
      <h1 className="text-2xl font-bold">Passwort festlegen</h1>
      {msg && <p className="text-green-700 text-sm">{msg}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium mb-1">Neues Passwort</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Mindestens 8 Zeichen"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Passwort bestätigen</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-60"
      >
        {loading ? "Speichern..." : "Passwort festlegen"}
      </button>
    </form>
  );
}

export default function StudentSetPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-gray-500">Lade...</p>}>
        <SetPasswordContent />
      </Suspense>
    </main>
  );
}

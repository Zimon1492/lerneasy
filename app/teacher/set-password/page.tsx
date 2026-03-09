"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Token direkt aus der URL auslesen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  // ✅ Passwort absenden
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Kein Token gefunden.");
      return;
    }

    if (password !== password2) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      const res = await fetch("/api/teacher/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler beim Speichern des Passworts.");
      } else {
        setSuccess("Passwort erfolgreich gesetzt! Du wirst weitergeleitet...");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (err) {
      console.error(err);
      setError("Serverfehler beim Speichern des Passworts.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Neues Passwort setzen
        </h1>
        <p className="text-gray-600 mb-4 text-center">
          Bitte lege ein neues Passwort fest. Danach gelangst du zu deinem Dashboard.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Neues Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            Passwort speichern
          </button>
        </form>
      </div>
    </div>
  );
}

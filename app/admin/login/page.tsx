"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falscher Schlüssel.");
        setLoading(false);
        return;
      }

      // fixed target (no searchParams): keep it simple
      router.push("/admin");
    } catch {
      setError("Netzwerkfehler beim Login.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Admin-Login</h1>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Admin-Key</span>
            <input
              type="password"
              required
              placeholder="geheimer Schlüssel"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border rounded p-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Wird geprüft..." : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}

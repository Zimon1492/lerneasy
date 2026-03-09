"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("student-credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.ok) {
      window.location.href = "/student/dashboard";
    } else {
      setError("E-Mail oder Passwort falsch");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Schüler Login
        </h1>

        <p className="text-sm text-slate-500 mb-6 text-center">
          Melde dich mit deinem Schüler-Konto an
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white shadow"
          >
            {loading ? "Anmelden..." : "Einloggen"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-3">
          <a href="/student/forgot-password" className="text-indigo-600 hover:underline">
            Passwort vergessen?
          </a>
        </p>

        <p className="text-center text-sm text-gray-600 mt-2">
          Lehrer?{" "}
          <a
            href="/teacher/login"
            className="text-indigo-600 hover:underline font-medium"
          >
            Zum Lehrer-Login
          </a>
        </p>
      </div>
    </div>
  );
}

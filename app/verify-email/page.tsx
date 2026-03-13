"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params  = useSearchParams();
  const success = params?.get("success");
  const error   = params?.get("error");

  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendState("loading");
    const res = await fetch("/api/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });
    setResendState(res.ok ? "done" : "error");
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">E-Mail bestätigt!</h1>
          <p className="text-gray-600 mb-6">Dein Konto ist jetzt aktiv. Du kannst dich jetzt einloggen.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg"
          >
            Zur Startseite & Einloggen
          </Link>
        </div>
      </div>
    );
  }

  const errorMessages: Record<string, string> = {
    expired: "Der Bestätigungslink ist abgelaufen (24h). Bitte fordere einen neuen an.",
    invalid:  "Ungültiger Bestätigungslink.",
    missing:  "Kein Token angegeben.",
    server:   "Serverfehler. Bitte versuche es erneut.",
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link ungültig</h1>
          <p className="text-gray-600 mb-6">{errorMessages[error] ?? "Unbekannter Fehler."}</p>
          <ResendForm
            email={resendEmail}
            setEmail={setResendEmail}
            state={resendState}
            onSubmit={handleResend}
          />
        </div>
      </div>
    );
  }

  // Direkt aufgerufen ohne Parameter — zeige Info-Seite
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">E-Mail bestätigen</h1>
        <p className="text-gray-600 mb-6">
          Wir haben dir einen Bestätigungslink geschickt. Bitte prüfe dein Postfach (auch Spam).
        </p>
        <ResendForm
          email={resendEmail}
          setEmail={setResendEmail}
          state={resendState}
          onSubmit={handleResend}
        />
      </div>
    </div>
  );
}

function ResendForm({
  email, setEmail, state, onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  state: "idle" | "loading" | "done" | "error";
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (state === "done") {
    return <p className="text-green-700 font-medium">Neue E-Mail wurde gesendet! Bitte prüfe dein Postfach.</p>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-gray-500">Keinen Link erhalten? Neuen anfordern:</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.at"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-60"
      >
        {state === "loading" ? "Wird gesendet…" : "Neuen Link anfordern"}
      </button>
      {state === "error" && <p className="text-red-600 text-sm">Fehler. Bitte versuche es erneut.</p>}
    </form>
  );
}

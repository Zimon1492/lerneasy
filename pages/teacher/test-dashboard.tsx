import { useEffect, useState } from "react";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

export default function TeacherDashboard() {
  const teacherId = "TEST_TEACHER_ID"; // später via Auth ersetzen

  type ConnectBalance = {
    availableCents: number;
    available: number;
    pendingCents: number;
    pending: number;
  };

  type PlatformBalance = {
    pendingReleaseCents: number;
    pendingRelease: number;
  };

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectBalance, setConnectBalance] = useState<ConnectBalance | null>(null);
  const [platformBalance, setPlatformBalance] = useState<PlatformBalance | null>(null);

  async function fetchStatus() {
    const res = await fetch(`/api/teacher/status?teacherId=${teacherId}`);
    const data = await res.json();
    setStatus(data);
  }

  async function fetchPlatformBalance() {
    const res = await fetch(`/api/teacher/platform-balance?teacherId=${teacherId}`);
    const data = await res.json();
    setPlatformBalance(data);
  }

  async function fetchConnectBalance() {
    const res = await fetch(`/api/teacher/connect-balance?teacherId=${teacherId}`);
    const data = await res.json();
    setConnectBalance(data);
  }

  async function startOnboarding() {
    setLoading(true);

    await fetch("/api/teacher/create-connect-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });

    const res = await fetch("/api/teacher/onboarding-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });

    const data = await res.json();
    window.location.href = data.url;
  }

  useEffect(() => {
    fetchStatus();
    fetchPlatformBalance();
    fetchConnectBalance();
  }, []);

  async function payoutToBank() {
    const res = await fetch("/api/teacher/bank-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Fehler: " + data.error);
    } else {
      alert("Auszahlung gestartet!");
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Lehrer Dashboard</h1>

      {!status ? (
        <p>Lade...</p>
      ) : (
        <>
          <h2>Stripe Konto</h2>

          {!status.hasConnect ? (
            <>
              <p>Sie haben noch kein Stripe Connect Konto.</p>
              <button onClick={startOnboarding} disabled={loading}>
                Stripe Konto einrichten
              </button>
            </>
          ) : (
            <>
              <p>
                Zahlungen empfangen:{" "}
                {status.charges_enabled ? "✔" : "✖"} <br />
                Auszahlungen möglich:{" "}
                {status.payouts_enabled ? "✔" : "✖"}
              </p>

              {!status.payouts_enabled && (
                <button onClick={startOnboarding} disabled={loading}>
                  Konto vervollständigen
                </button>
              )}
            </>
          )}

          <hr />

          <h2>Guthaben</h2>

          {platformBalance && (
            <p>
              <strong>In Verarbeitung (15-Tage-Wartezeit):</strong><br />
              {platformBalance.pendingRelease.toFixed(2)} €
            </p>
          )}

          {connectBalance && (
            <p>
              <strong>Auszahlbares Stripe-Guthaben:</strong><br />
              {connectBalance.available.toFixed(2)} €
            </p>
          )}

          {status?.payouts_enabled && (
            <button onClick={payoutToBank}>
              Jetzt auszahlen (an Bank)
            </button>
          )}

        </>
      )}
    </div>
  );
}

import Link from "next/link";

export default function SuccessPage() {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Buchung angefragt!</h1>
      <p style={{ color: "#4b5563", marginBottom: 8 }}>
        Deine Kartendaten wurden sicher gespeichert.
      </p>
      <p style={{ color: "#4b5563", marginBottom: 24 }}>
        Sobald der Lehrer deinen Termin annimmt, wird deine Karte belastet und du erhältst eine Bestätigungs-E-Mail.
        Wenn der Lehrer innerhalb von 6 Tagen nicht reagiert oder ablehnt, werden deine Kartendaten automatisch gelöscht.
      </p>
      <Link
        href="/student/dashboard"
        style={{
          display: "inline-block",
          background: "#2563eb",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Zurück zum Dashboard
      </Link>
    </div>
  );
}

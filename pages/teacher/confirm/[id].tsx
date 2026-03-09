// pages/teacher/confirm/[id].tsx
import { useRouter } from "next/router";
import { useState } from "react";

//
//  [id].tsx:
//    Page für den Lehrer, um einen Termin zu akzeptieren/ablehnen 
//

export default function TeacherConfirmPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function confirmBooking() {
    if (!id) return;

    setLoading(true);

    const res = await fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      setMessage("✔ Termin bestätigt & Zahlung erfolgreich abgebucht!");
    } else {
      setMessage("❌ Fehler: " + data.error);
    }
  }

  if (!id) return <div>Lade Booking…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Termin bestätigen</h1>
      <p>Booking ID: {id}</p>

      <button
        onClick={confirmBooking}
        disabled={loading}
        style={{
          background: "#16a34a",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        {loading ? "Wird bestätigt..." : "Termin bestätigen"}
      </button>

      {message && (
        <p style={{ marginTop: 20, fontSize: "18px" }}>
          {message}
        </p>
      )}
    </div>
  );
}

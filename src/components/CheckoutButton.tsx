// components/CheckoutButton.tsx
import React from "react";    

export default function CheckoutButton({
  teacherId,
  studentName,
  studentEmail,
  start,    //Termin-Start
  end,      //Termin-Ende
  priceCents,
}: {
  teacherId: string;
  studentName: string;
  studentEmail: string;
  start: string;      // ISO Datum
  end: string;        // ISO Datum
  priceCents: number;
}) {
  async function handleCheckout() {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId,
        studentName,
        studentEmail,
        start,
        end,
        priceCents,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Fehler beim Starten des Checkouts");
      console.error(data);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      style={{
        padding: "12px 20px",
        background: "#2563eb",
        color: "#fff",
        borderRadius: "8px",
        fontSize: "16px",
      }}
    >
      Jetzt bezahlen (Test)
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  rating: number;
  price?: number;
  avatarUrl?: string | null;
};

export default function TeacherSelectPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subject, setSubject] = useState("");

  const loadTeachers = async () => {
    const res = await fetch("/api/teachers", { cache: "no-store" });
    if (!res.ok) return;

    let data = (await res.json()).data || [];

    if (subject.trim() !== "") {
      data = data.filter((t: Teacher) =>
        t.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    setTeachers(data);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">

      {/* TITLE */}
      <h1 className="text-4xl font-bold text-center mb-14">
        Lehrer:in auswählen
      </h1>

      {/* FILTER */}
      <div className="flex items-center justify-center gap-4 mb-14 flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Fach</label>
          <input
            type="text"
            placeholder="Fach auswählen"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 w-60 bg-white"
          />
        </div>

        <button
          onClick={loadTeachers}
          className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-80 transition"
        >
          Suche
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teachers.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">
            Keine Lehrer gefunden.
          </p>
        )}

        {teachers.map((t) => (
          <div
            key={t.id}
            className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 flex gap-5"
          >
            <img
              src={t.avatarUrl ?? "/avatar-placeholder.png"}
              className="w-20 h-20 rounded-full object-cover"
            />

            <div className="flex flex-col justify-between flex-1">
              <div>
                <h2 className="font-semibold text-lg">{t.name}</h2>
                <p className="text-gray-600">{t.subject}</p>
                <p className="font-medium mt-1">{t.price ?? 40} €/Std.</p>
              </div>

              <div className="flex text-yellow-400 mt-2">
                {"★".repeat(Math.round(t.rating))}
                {"☆".repeat(5 - Math.round(t.rating))}
              </div>
            </div>

            <div className="flex items-center">
              <a
                href={`/book/${t.id}`}
                className="bg-black text-white px-5 py-2 rounded-xl hover:opacity-80 transition"
              >
                Buchen
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

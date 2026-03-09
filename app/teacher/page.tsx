"use client";

import { useEffect, useState } from "react";

type T = { id: string; name: string; email: string; subject: string };

export default function TeacherHome() {
  const [teacher, setTeacher] = useState<T | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("teacher");
    if (raw) {
      try {
        setTeacher(JSON.parse(raw));
      } catch {}
    }
  }, []);

  if (!teacher) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="mb-4">Nicht eingeloggt.</p>
          <a
            href="/teacher/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
          >
            Zum Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Hallo, {teacher.name} 👋</h1>
      <p className="text-gray-600 mb-6">
        Fach: {teacher.subject} · E-Mail: {teacher.email}
      </p>

      {/* Platzhalter – hier bauen wir später Kalender + Chat */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Kalender</h2>
          <p className="text-sm text-gray-500">Kommt im nächsten Schritt.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Chats</h2>
          <p className="text-sm text-gray-500">Kommt im nächsten Schritt.</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Teacher } from "@prisma/client";

type Props = {
  teachers: Teacher[];
  onSelect: (t: Teacher) => void;
};

export default function TeacherGrid({ teachers, onSelect }: Props) {
  // nur Darstellung + „onSelect“ nach oben melden
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
      {teachers.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          className="rounded-2xl border shadow-sm bg-white p-6 text-center hover:shadow-md transition cursor-pointer"
          title={`Termin bei ${t.name} anfragen`}
        >
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4" />
          <h3 className="font-semibold text-lg">{t.name}</h3>
          <p className="text-sm text-gray-600">{t.subject}</p>
          <div className="text-yellow-400 mt-2">
            {"★".repeat((t as any).rating ?? 0)}
            {"☆".repeat(5 - ((t as any).rating ?? 0))}
          </div>
        </button>
      ))}
    </div>
  );
}

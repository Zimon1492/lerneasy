"use client";

import type { Teacher } from "app/lib/types";
import Avatar from "app/components/Avatar";

export default function TeacherCard({ teacher }: { teacher: Teacher }) {
  const avg = teacher.avgRating ?? teacher.rating ?? 0;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(avg));

  return (
    <div
      className="snap-center shrink-0 w-56 h-64 sm:w-64 sm:h-72 md:w-72 md:h-80
                 rounded-3xl border border-gray-100 bg-white p-5
                 flex flex-col items-center justify-between
                 shadow-sm hover:shadow-lg hover:-translate-y-0.5
                 transition-all duration-200"
      title={teacher.name}
    >
      <div className="flex flex-col items-center">
        <Avatar
          src={teacher.avatarUrl || teacher.profilePicture}
          name={teacher.name}
          size={96}
          className="w-20 h-20 md:w-24 md:h-24 ring-4 ring-gray-50 mb-4"
        />
        <h3 className="font-semibold text-base md:text-lg text-center">{teacher.name}</h3>
        <span className="mt-1 inline-flex items-center gap-1 text-xs md:text-sm px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
          {teacher.subject}
        </span>
      </div>

      <div className="flex items-center gap-0.5 text-amber-500 text-sm md:text-base">
        {stars.map((on, i) => (
          <span key={i}>{on ? "★" : "☆"}</span>
        ))}
        {teacher.ratingCount != null && teacher.ratingCount > 0 && (
          <span className="ml-1 text-gray-400 text-xs">({teacher.ratingCount})</span>
        )}
      </div>
    </div>
  );
}

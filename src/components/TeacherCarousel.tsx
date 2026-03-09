"use client";

import { useEffect, useRef, useState } from "react";
import TeacherCard from "./TeacherCard";
import type { Teacher } from "app/lib/types";

export default function TeacherCarousel({ teachers }: { teachers: Teacher[] }) {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance every 2 seconds
  useEffect(() => {
    if (teachers.length < 2) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % teachers.length);
    }, 2000);
    return () => clearInterval(id);
  }, [teachers.length]);

  // Scroll active card into center
  useEffect(() => {
    const card = cardRefs.current[active];
    const container = containerRef.current;
    if (!card || !container) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const scrollTo = cardCenter - container.clientWidth / 2;
    container.scrollTo({ left: scrollTo, behavior: "smooth" });
  }, [active]);

  if (teachers.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

      {/* Scroller */}
      <div
        ref={containerRef}
        className="no-scrollbar overflow-x-auto scroll-smooth px-2 md:px-6"
      >
        <div className="flex items-center gap-4 md:gap-8 py-3 md:py-4">
          <div className="shrink-0 w-[calc(50vw-140px)]" />
          {teachers.map((t, i) => (
            <div
              key={t.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => setActive(i)}
              className={`shrink-0 transition-all duration-500 cursor-pointer ${
                i === active ? "scale-110 z-10" : "scale-90 opacity-50"
              }`}
            >
              <TeacherCard teacher={t} />
            </div>
          ))}
          <div className="shrink-0 w-[calc(50vw-140px)]" />
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {teachers.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === active ? "bg-blue-600 w-5" : "bg-gray-300"
            }`}
            aria-label={`Lehrer ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

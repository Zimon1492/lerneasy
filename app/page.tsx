"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AuthModal from "./components/AuthModal";
import ChatWhatsAppModal from "./components/ChatWidget";
import TeacherCarouselWrapper from "@/src/components/TeacherCarouselWrapper";
import TeacherApplySection from "./components/TeacherApplySection";
import CookieBanner from "./components/CookieBanner";
import CookieSettingsButton from "./components/CookieSettingsButton";
import type { Teacher } from "@/app/lib/types";

type Rating = {
  id: string;
  stars: number;
  comment: string | null;
  studentName: string;
  teacherSubject: string;
};

function VerifiedBanner({ onLogin }: { onLogin: () => void }) {
  const params   = useSearchParams();
  const verified = params?.get("verified") === "1";
  if (!verified) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium">
      <span>✅ E-Mail erfolgreich bestätigt! Du kannst dich jetzt einloggen.</span>
      <button onClick={onLogin} className="underline hover:no-underline">Einloggen</button>
    </div>
  );
}

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    fetch("/api/public/homepage")
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data.teachers ?? []);
        setRatings(data.ratings ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen">
      {/* 🔹 Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* 🔹 E-Mail-Bestätigung Banner */}
      <Suspense fallback={null}>
        <VerifiedBanner onLogin={() => setShowAuth(true)} />
      </Suspense>

      {/* 🔹 HERO */}
      <section className="relative w-full min-h-[480px] md:min-h-[580px] flex items-center overflow-hidden">
        {/* Hintergrundbild */}
        <Image
          src="/homepage_background.png"
          alt="Hintergrundbild"
          fill
          priority
          className="object-cover object-center md:object-[center_30%]"
          sizes="100vw"
        />
        {/* Dunkler Overlay für Lesbarkeit */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Logo oben links */}
        <div className="absolute top-6 left-6 md:left-10 z-10">
          <Image
            src="/lerneasy-white.svg"
            alt="LernEasy"
            width={160}
            height={48}
            priority
          />
        </div>

        {/* Inhalt */}
        <div className="relative z-10 mx-auto max-w-6xl w-full px-6 md:px-10 py-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white drop-shadow">
            Nachhilfetermine
            <br /> einfach buchen
          </h1>
          <p className="text-white/90 text-lg max-w-xl">
            Vereinbare online deine Einzelsitzung mit einer Nachhilfelehrerin
            oder einem Nachhilfelehrer deiner Wahl.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow"
            >
              Jetzt buchen
            </button>
            <Link
              href="/auth/teacher/login"
              className="px-6 py-3 rounded-lg border border-white text-white font-semibold hover:bg-white/10 transition"
            >
              Lehrer-Login
            </Link>
          </div>
        </div>
      </section>

      {/* 🔹 NUR 4 LEHRER ANZEIGEN */}
      <section className="bg-white border-t">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-14">
          <h2 className="text-3xl font-bold text-center mb-10">
            Unsere Lehrerinnen & Lehrer
          </h2>
          <TeacherCarouselWrapper teachers={teachers} />
        </div>
      </section>

      {/* 🔹 ABLAUF */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Ablauf</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="space-y-3">
              <div className="text-4xl">👩‍🏫</div>
              <h3 className="font-semibold text-xl">Lehrperson wählen</h3>
              <p className="text-gray-600">
                Wähle deine Lehrerin oder deinen Lehrer sowie Datum und Zeit aus.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">📅</div>
              <h3 className="font-semibold text-xl">Termin buchen</h3>
              <p className="text-gray-600">
                Gib deine Daten ein und bestätige die Buchung.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl">📚</div>
              <h3 className="font-semibold text-xl">Lernen!</h3>
              <p className="text-gray-600">
                Triff deine Lehrerin oder deinen Lehrer und beginne die Nachhilfe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 TESTIMONIALS */}
      {ratings.length > 0 && (
        <section className="bg-white border-t">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-16">
            <h2 className="text-3xl font-bold text-center mb-3">
              Was unsere Nutzer sagen
            </h2>
            <p className="text-center text-gray-600 mb-10">
              Echte Erfahrungen von Schülerinnen, Schülern und Eltern
            </p>

            <div className="grid gap-8 md:grid-cols-3">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border shadow-sm bg-white p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div>
                      <div className="font-semibold">{r.studentName}</div>
                      <div className="text-sm text-gray-600">{r.teacherSubject}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                  <div className="text-yellow-400">
                    {"★".repeat(r.stars)}
                    {"☆".repeat(5 - r.stars)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🔹 LEHRER BEWERBUNG */}
      <TeacherApplySection />

      {/* 🔹 FOOTER */}
      <footer className="bg-white border-t">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-lg">LernEasy</div>
            <p className="text-gray-600 mt-2">
              Nachhilfe einfach online buchen – von geprüften Lehrerinnen & Lehrern.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Angebot</div>
            <ul className="space-y-1 text-gray-600">
              <li>Mathematik</li>
              <li>Englisch</li>
              <li>Biologie</li>
              <li>und vieles mehr!</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Rechtliches</div>
            <ul className="space-y-1 text-gray-600">
              <li>
                <a href="/agb" className="hover:text-blue-600 hover:underline">AGB</a>
              </li>
              <li>
                <a href="/datenschutz" className="hover:text-blue-600 hover:underline">
                  Datenschutzerklärung
                </a>
              </li>
              <li>
                <a href="/impressum" className="hover:text-blue-600 hover:underline">Impressum</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Kontakt</div>
            <ul className="space-y-1 text-gray-600">
              <li>office.lerneasy@gmail.com</li>
              <li>Mo–Fr 9–17 Uhr</li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-6 text-sm text-gray-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} LernEasy</span>
            <CookieSettingsButton />
          </div>
        </div>
      </footer>
      <CookieBanner />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie_consent";

export type ConsentValue = "accepted" | "declined";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    // Reload so AdSense script gets injected
    window.location.reload();
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-lg px-4 py-5 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">Cookies & Werbung</p>
          <p>
            Diese Website verwendet <strong>technisch notwendige Cookies</strong> für Login und
            Zahlungsabwicklung. Mit deiner Zustimmung setzen wir außerdem <strong>Google AdSense</strong>-Cookies
            ein, um personalisierte Werbung anzuzeigen. Google kann dabei Daten gemäß seiner{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600 hover:text-blue-800"
            >
              Datenschutzerklärung
            </a>{" "}
            verarbeiten. Weitere Infos in unserer{" "}
            <a href="/datenschutz" className="underline text-blue-600 hover:text-blue-800">
              Datenschutzerklärung
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col sm:flex-row gap-2">
          <button
            onClick={decline}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
          >
            Nur notwendige
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

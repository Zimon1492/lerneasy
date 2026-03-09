"use client";

import { useEffect, useState } from "react";

const NOTICE_KEY = "cookie_notice";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(NOTICE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(NOTICE_KEY, "seen");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-lg px-4 py-5 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">Hinweis zu Cookies</p>
          <p>
            Diese Website verwendet ausschließlich <strong>technisch notwendige Cookies</strong>{" "}
            für den Login und die sichere Zahlungsabwicklung. Diese Cookies sind für den Betrieb
            der Plattform erforderlich und bedürfen nach §&nbsp;165 Abs.&nbsp;3 TKG 2021 keiner
            gesonderten Einwilligung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
            Weitere Informationen findest du in unserer{" "}
            <a href="/datenschutz" className="underline text-blue-600 hover:text-blue-800">
              Datenschutzerklärung
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={dismiss}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
          >
            Schließen
          </button>
          <button
            onClick={dismiss}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}

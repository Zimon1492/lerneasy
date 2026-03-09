"use client";

export default function CookieSettingsButton() {
  function openSettings() {
    localStorage.removeItem("cookie_consent");
    window.location.reload();
  }

  return (
    <button onClick={openSettings} className="hover:text-gray-600 transition">
      Cookie-Einstellungen
    </button>
  );
}

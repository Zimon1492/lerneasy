import Link from "next/link";
import CookieSettingsButton from "./CookieSettingsButton";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white mt-auto py-4 px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span>&copy; {new Date().getFullYear()} LernApp &mdash; Nachhilfe in &Ouml;sterreich</span>
        <div className="flex items-center gap-5">
          <Link href="/impressum" className="hover:text-gray-600 transition">Impressum</Link>
          <Link href="/agb" className="hover:text-gray-600 transition">AGB</Link>
          <Link href="/datenschutz" className="hover:text-gray-600 transition">Datenschutz</Link>
          <CookieSettingsButton />
        </div>
      </div>
    </footer>
  );
}

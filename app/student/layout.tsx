"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Footer from "@/app/components/Footer";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Suche" },
  { href: "/student/payments",  label: "Buchungen" },
  { href: "/student/chat",      label: "Chat",  badge: true },
  { href: "/student/profile",   label: "Profil" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && (session.user as any)?.role !== "student") router.replace("/");
  }, [status, session]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/student/unread-chats-count", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setUnreadChatCount(data.count ?? 0))
      .catch(() => {});
  }, [pathname, status]);

  // Close menu when navigating
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="w-full bg-white border-b shadow-sm z-40 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/student/dashboard" className="font-bold text-lg text-blue-600 tracking-tight">
            LernApp
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map(({ href, label, badge }) => {
              const count = badge ? unreadChatCount : 0;
              const active = pathname?.startsWith(href) ?? false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative transition ${active ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"}`}
                >
                  {label}
                  {count > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop: user + logout */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <span className="truncate max-w-[160px]">{session?.user?.name || session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium"
            >
              Abmelden
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menü öffnen"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 space-y-1">
            <div className="pt-2 pb-3 border-b border-gray-100 text-sm text-gray-500 truncate">
              {session?.user?.name || session?.user?.email}
            </div>
            {NAV_ITEMS.map(({ href, label, badge }) => {
              const count = badge ? unreadChatCount : 0;
              const active = pathname?.startsWith(href) ?? false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left text-red-600 hover:bg-red-50 transition"
            >
              Abmelden
            </button>
          </div>
        )}
      </nav>

      <div className={`flex-1 ${pathname?.startsWith("/student/chat") ? "" : "px-4 py-4 md:px-6"}`}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",              label: "Dashboard",   icon: "▦" },
  { href: "/admin/teachers",     label: "Lehrer",      icon: "🎓" },
  { href: "/admin/students",     label: "Schüler",     icon: "👤" },
  { href: "/admin/bookings",     label: "Buchungen",   icon: "📅" },
  { href: "/admin/applications", label: "Bewerbungen", icon: "📋" },
  { href: "/admin/errors",       label: "Fehler-Logs", icon: "⚠" },
  { href: "/admin/settings",    label: "Einstellungen", icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Login-Seite ohne Sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="text-xl font-bold tracking-tight">LernApp</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
          >
            <span>↩</span>
            Abmelden
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

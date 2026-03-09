"use client";

import { useEffect, useState } from "react";

type ErrorLog = {
  id: string;
  createdAt: string;
  filepath: string;
  errorCode: string;
  errorText: string;
};

export default function AdminErrorsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/error-logs", { cache: "no-store" });
    const json = await res.json();
    setLogs(json.logs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/error-logs?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function handleClearAll() {
    if (!confirm("Alle Fehler-Logs wirklich löschen?")) return;
    setClearingAll(true);
    await fetch("/api/admin/error-logs", { method: "DELETE" });
    setClearingAll(false);
    load();
  }

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.filepath.toLowerCase().includes(q) ||
      l.errorCode.toLowerCase().includes(q) ||
      l.errorText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fehler-Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} Einträge (max. 500)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56"
          />
          <button
            onClick={handleClearAll}
            disabled={clearingAll || logs.length === 0}
            className="px-3 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {clearingAll ? "Lösche..." : "Alle löschen"}
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Lade...</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-40">Zeitpunkt</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Datei / Route</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-32">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Fehlermeldung</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("de-AT")}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-blue-700 break-all">
                  {log.filepath}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block text-xs font-mono bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5">
                    {log.errorCode || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700 break-all whitespace-pre-wrap font-mono">
                  {log.errorText}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                  >
                    {deletingId === log.id ? "..." : "Löschen"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Keine Fehler-Logs gefunden.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  type: string;
  issuedAt: string;
  issuerName: string;
  issuerAddress: string;
  issuerUid: string | null;
  studentName: string;
  studentEmail: string;
  teacherName: string;
  teacherEmail: string;
  teacherAddress: string | null;
  teacherTaxNumber: string | null;
  subject: string | null;
  serviceDate: string;
  serviceStartTime: string;
  serviceEndTime: string;
  durationMinutes: number;
  priceCents: number;
  commissionCents: number | null;
  teacherNetCents: number | null;
  teacherSharePct: number | null;
  currency: string;
  taxRatePct: number;
  bookingId: string;
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState<"zahlungsbeleg" | "gutschrift">("zahlungsbeleg");
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/invoices", { cache: "no-store" });
    const json = await res.json();
    setInvoices(json.invoices ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/admin/invoices/export");
    if (!res.ok) { setExporting(false); alert("Export fehlgeschlagen."); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `lerneasy-belege-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const byType = invoices.filter((i) => i.type === tab);
  const filtered = byType.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.studentName.toLowerCase().includes(q)   ||
      inv.studentEmail.toLowerCase().includes(q)  ||
      inv.teacherName.toLowerCase().includes(q)   ||
      (inv.subject ?? "").toLowerCase().includes(q)
    );
  });

  const totalCents = filtered.reduce((s, i) => s + i.priceCents, 0);
  const totalProvision = filtered.reduce((s, i) => s + (i.commissionCents ?? 0), 0);

  const zahlungsbelege = invoices.filter((i) => i.type === "zahlungsbeleg");
  const gutschriften   = invoices.filter((i) => i.type === "gutschrift");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Belege & Rechnungen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {zahlungsbelege.length} Zahlungsbelege · {gutschriften.length} Gutschriften
          </p>
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
            onClick={handleExport}
            disabled={exporting || invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            {exporting ? "Exportiere..." : "Excel exportieren"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("zahlungsbeleg")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === "zahlungsbeleg"
              ? "bg-white shadow text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Zahlungsbelege (Schüler)
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
            {zahlungsbelege.length}
          </span>
        </button>
        <button
          onClick={() => setTab("gutschrift")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === "gutschrift"
              ? "bg-white shadow text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Gutschriften (Lehrer)
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
            {gutschriften.length}
          </span>
        </button>
      </div>

      {/* Zusammenfassung */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Dokumente (gefiltert)</div>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </div>
          {tab === "zahlungsbeleg" ? (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Gesamtumsatz</div>
                <div className="text-2xl font-bold text-green-700">
                  {(totalCents / 100).toFixed(2)} EUR
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">USt. gesamt</div>
                <div className="text-2xl font-bold text-gray-400">0,00 EUR</div>
                <div className="text-xs text-gray-400">§ 6 Abs. 1 Z 27 UStG</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Gesamtprovision</div>
                <div className="text-2xl font-bold text-blue-700">
                  {(totalProvision / 100).toFixed(2)} EUR
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Auszahlungen Lehrer</div>
                <div className="text-2xl font-bold text-purple-700">
                  {((totalCents - totalProvision) / 100).toFixed(2)} EUR
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {loading && <p className="text-gray-400">Lade...</p>}

      {/* Tabelle */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {tab === "zahlungsbeleg" ? (
          <ZahlungsbelgeTable rows={filtered} />
        ) : (
          <GutschriftenTable rows={filtered} />
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">Keine Belege gefunden.</p>
        )}
      </div>
    </div>
  );
}

function ZahlungsbelgeTable({ rows }: { rows: Invoice[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Belegnr.</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Ausgestellt</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Schüler</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Lehrer / Fach</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Leistungsdatum</th>
          <th className="text-right px-4 py-3 font-semibold text-gray-600">Betrag</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((inv) => (
          <tr key={inv.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <span className="font-mono text-xs font-semibold text-blue-700">{inv.invoiceNumber}</span>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500">
              {new Date(inv.issuedAt).toLocaleDateString("de-AT")}
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">{inv.studentName}</div>
              <div className="text-xs text-gray-400">{inv.studentEmail}</div>
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">{inv.teacherName}</div>
              <div className="text-xs text-gray-400">{inv.subject ?? "—"}</div>
            </td>
            <td className="px-4 py-3 text-xs text-gray-600">
              <div>{new Date(inv.serviceDate).toLocaleDateString("de-AT")}</div>
              <div className="text-gray-400">{inv.serviceStartTime} – {inv.serviceEndTime}</div>
            </td>
            <td className="px-4 py-3 text-right font-semibold">
              {(inv.priceCents / 100).toFixed(2)} {inv.currency.toUpperCase()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GutschriftenTable({ rows }: { rows: Invoice[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Gutschrift-Nr.</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Ausgestellt</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Lehrer</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Fach / Datum</th>
          <th className="text-right px-4 py-3 font-semibold text-gray-600">Brutto</th>
          <th className="text-right px-4 py-3 font-semibold text-gray-600">Provision</th>
          <th className="text-right px-4 py-3 font-semibold text-gray-600 text-green-700">Auszahlung</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((inv) => (
          <tr key={inv.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <span className="font-mono text-xs font-semibold text-purple-700">{inv.invoiceNumber}</span>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500">
              {new Date(inv.issuedAt).toLocaleDateString("de-AT")}
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">{inv.teacherName}</div>
              <div className="text-xs text-gray-400">{inv.teacherEmail}</div>
              {inv.teacherTaxNumber && (
                <div className="text-xs text-gray-400">UID: {inv.teacherTaxNumber}</div>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-gray-600">
              <div>{inv.subject ?? "—"}</div>
              <div className="text-gray-400">
                {new Date(inv.serviceDate).toLocaleDateString("de-AT")}, {inv.serviceStartTime}–{inv.serviceEndTime}
              </div>
            </td>
            <td className="px-4 py-3 text-right text-gray-700">
              {(inv.priceCents / 100).toFixed(2)}
            </td>
            <td className="px-4 py-3 text-right text-red-600">
              − {((inv.commissionCents ?? 0) / 100).toFixed(2)}
              {inv.teacherSharePct != null && (
                <div className="text-xs text-gray-400">
                  {Math.round((1 - inv.teacherSharePct) * 100)}%
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-green-700">
              {((inv.teacherNetCents ?? 0) / 100).toFixed(2)} {inv.currency.toUpperCase()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

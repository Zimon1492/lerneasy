"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/Avatar";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
  address: string | null;
  schoolTrack: string | null;
  schoolForm: string | null;
  level: string | null;
  grade: number | null;
  schoolName: string | null;
};

const AHS_FORMS: { value: string; label: string }[] = [
  { value: "AHS_GYMNASIUM", label: "Gymnasium / Klassisches Gymnasium" },
  { value: "AHS_REALGYMNASIUM", label: "Realgymnasium" },
  { value: "AHS_WK_REALGYMNASIUM", label: "Wirtschaftskundliches Realgymnasium" },
  { value: "AHS_BORG", label: "BORG (Oberstufenrealgymnasium)" },
  { value: "AHS_SCHWERPUNKT", label: "AHS mit Schwerpunkt" },
];

const BHS_FORMS: { value: string; label: string }[] = [
  { value: "BHS_HTL", label: "HTL" },
  { value: "BHS_HAK", label: "HAK" },
  { value: "BHS_HLW", label: "HLW / HWS" },
  { value: "BHS_MODE", label: "HLA Mode" },
  { value: "BHS_KUNST_GESTALTUNG", label: "HLA Kunst & Gestaltung" },
  { value: "BHS_TOURISMUS", label: "HLA Tourismus" },
  { value: "BHS_SOZIALPAED", label: "Sozial-/Elementarpadagogik" },
  { value: "BHS_LAND_FORST", label: "Land- & Forstwirtschaft" },
];

export default function StudentProfilePage() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolTrack, setSchoolTrack] = useState("");
  const [schoolForm, setSchoolForm] = useState("");
  const [grade, setGrade] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picPreview, setPicPreview] = useState<string | null>(null);

  const formOptions = schoolTrack === "AHS" ? AHS_FORMS : schoolTrack === "BHS" ? BHS_FORMS : [];

  async function load() {
    setLoading(true);
    const res = await fetch("/api/student/profile", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    const p: Profile = json.data;
    setProfile(p);
    setName(p?.name ?? "");
    setAddress(p?.address ?? "");
    setSchoolName(p?.schoolName ?? "");
    setSchoolTrack(p?.schoolTrack ?? "");
    setSchoolForm(p?.schoolForm ?? "");
    setGrade(p?.grade != null ? String(p.grade) : "");
    setPicPreview(p?.profilePicture ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "authenticated") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Reset schoolForm when track changes
  function handleTrackChange(val: string) {
    setSchoolTrack(val);
    setSchoolForm("");
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        schoolName,
        schoolTrack: schoolTrack || undefined,
        schoolForm: schoolForm || undefined,
        grade: grade ? Number(grade) : undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Gespeichert." : json?.error ?? "Fehler");
    setSaving(false);
  }

  async function deleteAccount() {
    if (!confirm("Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    setDeleting(true);
    const res = await fetch("/api/student/account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/auth/login";
    } else {
      const json = await res.json().catch(() => ({}));
      setMsg(json?.error ?? "Fehler beim Löschen.");
      setDeleting(false);
    }
  }

  async function uploadPicture(file: File) {
    setUploadingPic(true);
    setMsg(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/student/profile/picture", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setPicPreview(json.url);
      setMsg("Profilbild aktualisiert.");
    } else {
      setMsg(json?.error ?? "Fehler beim Hochladen.");
    }
    setUploadingPic(false);
  }

  if (status === "loading" || loading) {
    return <main className="p-10 text-gray-500">Lade...</main>;
  }

  const levelLabel = Number(grade) >= 1 && Number(grade) <= 4 ? "Unterstufe" : Number(grade) >= 5 ? "Oberstufe" : null;

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>

      {msg && (
        <p className={`mb-4 text-sm ${msg.includes("Fehler") ? "text-red-600" : "text-green-700"}`}>
          {msg}
        </p>
      )}

      {/* Profilbild */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6 flex items-center gap-6">
        <Avatar src={picPreview} name={name} size={96} className="w-24 h-24 shrink-0" />
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPic}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {uploadingPic ? "Hochladen..." : "Bild andern"}
          </button>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG oder WebP</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPicture(f); }}
          />
        </div>
      </div>

      {/* Angaben */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-lg">Personliche Angaben</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            type="text"
            value={profile?.email ?? ""}
            disabled
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="z.B. Musterstrasse 1, 1010 Wien"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="pt-2 border-t">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Schule</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Schulname</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="z.B. BG/BRG Musterstadt"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Schultyp</label>
                <select
                  value={schoolTrack}
                  onChange={(e) => handleTrackChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Bitte wahlen...</option>
                  <option value="AHS">AHS</option>
                  <option value="BHS">BHS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Klasse
                  {levelLabel && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">({levelLabel})</span>
                  )}
                </label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="z.B. 6"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {schoolTrack && (
              <div>
                <label className="block text-sm font-medium mb-1">Schulform</label>
                <select
                  value={schoolForm}
                  onChange={(e) => setSchoolForm(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Bitte wahlen...</option>
                  {formOptions.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
      </div>

      {/* Konto löschen */}
      <div className="mt-8 bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <h2 className="font-semibold text-lg text-red-700 mb-1">Konto löschen</h2>
        <p className="text-sm text-gray-500 mb-4">
          Dein Konto und alle damit verbundenen Daten werden unwiderruflich gelöscht.
        </p>
        <button
          onClick={deleteAccount}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {deleting ? "Löschen..." : "Konto löschen"}
        </button>
      </div>
    </main>
  );
}

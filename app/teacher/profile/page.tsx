"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/Avatar";

type Profile = {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  address: string | null;
  description: string | null;
  taxNumber: string | null;
  avgRating: number | null;
  ratingCount: number;
};

type RatingItem = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  student: { name: string | null };
};

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-amber-400 text-lg">
      {Array.from({ length: 5 }, (_, i) => (i < Math.round(value) ? "★" : "☆")).join("")}
    </span>
  );
}

export default function TeacherProfilePage() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picPreview, setPicPreview] = useState<string | null>(null);

  async function load() {
    if (!session?.user?.email) return;
    setLoading(true);
    const email = encodeURIComponent(session.user.email);

    const [profileRes, ratingsRes] = await Promise.all([
      fetch(`/api/teacher/profile?email=${email}`, { cache: "no-store" }),
      fetch(`/api/ratings?teacherId=`, { cache: "no-store" }), // filled after we have the id
    ]);

    const profileJson = await profileRes.json().catch(() => ({}));
    const p: Profile = profileJson.data;
    setProfile(p);
    setName(p?.name ?? "");
    setAddress(p?.address ?? "");
    setDescription(p?.description ?? "");
    setTaxNumber(p?.taxNumber ?? "");
    setPicPreview(p?.profilePicture ?? null);

    if (p?.id) {
      const ratRes = await fetch(`/api/ratings?teacherId=${p.id}`, { cache: "no-store" });
      const ratJson = await ratRes.json().catch(() => ({}));
      setRatings(ratJson.ratings ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (status === "authenticated") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function save() {
    if (!session?.user?.email) return;
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/teacher/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, name, address, description, taxNumber }),
    });
    const json = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Gespeichert." : json?.error ?? "Fehler");
    setSaving(false);
  }

  async function uploadPicture(file: File) {
    if (!session?.user?.email) return;
    setUploadingPic(true);
    setMsg(null);
    const form = new FormData();
    form.append("email", session.user.email);
    form.append("file", file);

    const res = await fetch("/api/teacher/profile/picture", { method: "POST", body: form });
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPicture(f);
            }}
          />
        </div>
      </div>

      {/* Profil-Felder */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-lg">Angaben</h2>

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
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="z.B. Musterstrasse 1, 1010 Wien"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Steuernummer / SVS-Nummer{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            placeholder="z.B. 12 345/6789 oder SVNR"
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">
            Wird nur intern gespeichert und nicht öffentlich angezeigt.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Uber mich</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Erzahl den Schulern etwas uber dich, deine Erfahrung und deinen Unterrichtsstil..."
            className="w-full border rounded-lg px-3 py-2 resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
      </div>

      {/* Bewertungen */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-semibold text-lg">Meine Bewertungen</h2>
          {profile?.avgRating != null && (
            <span className="flex items-center gap-1">
              <StarDisplay value={profile.avgRating} />
              <span className="text-sm text-gray-500">
                {profile.avgRating.toFixed(1)} ({profile.ratingCount})
              </span>
            </span>
          )}
        </div>

        {ratings.length === 0 && (
          <p className="text-gray-500 text-sm">Noch keine Bewertungen erhalten.</p>
        )}

        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <StarDisplay value={r.stars} />
                <span className="text-sm text-gray-500">
                  {r.student?.name ?? "Schuler"} &middot;{" "}
                  {new Date(r.createdAt).toLocaleDateString("de-AT")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

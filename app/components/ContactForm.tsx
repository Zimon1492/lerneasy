"use client";

export default function ContactForm() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("Danke! (Demo) – Hier würden wir später das Formular an die API senden.");
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Max Mustermann"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">E-Mail</label>
        <input
          type="email"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="max@mail.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nachricht</label>
        <textarea
          className="w-full rounded-lg border px-3 py-2 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Ich suche Hilfe in Mathematik, 8. Klasse…"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
      >
        Nachricht senden
      </button>
      <p className="text-xs text-gray-500 text-center">
        Mit dem Absenden akzeptierst du unsere Datenschutzbestimmungen.
      </p>
    </form>
  );
}

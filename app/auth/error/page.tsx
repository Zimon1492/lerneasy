export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-3">Fehler bei der Anmeldung</h1>
        <p className="text-gray-600 mb-6">
          Es gab ein Problem bei der Anmeldung oder Registrierung. Bitte versuche es erneut.
        </p>
        <a href="/" className="text-blue-600 font-semibold hover:underline">
          Zurück zur Startseite
        </a>
      </div>
    </main>
  );
}

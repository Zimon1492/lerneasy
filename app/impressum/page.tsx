export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Angaben gem&auml;&szlig; &sect; 5 ECG</h2>
          <p className="text-gray-700 leading-relaxed">
            LernEasy e.U.<br />
            Steinbachfeldweg 5<br />
            5400 Hallein<br />
            &Ouml;sterreich
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
          <p className="text-gray-700 leading-relaxed">
            E-Mail: <a href="mailto:office.lerneasy@gmail.com" className="text-blue-600 hover:underline">office.lerneasy@gmail.com</a><br />
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Unternehmensgegenstand</h2>
          <p className="text-gray-700 leading-relaxed">
            Vermittlung von Nachhilfeleistungen zwischen Sch&uuml;lerinnen und Sch&uuml;lern sowie qualifizierten Lehrpersonen in &Ouml;sterreich.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Gewerbebeh&ouml;rde</h2>
          <p className="text-gray-700 leading-relaxed">
            Magistrat der Stadt Wien, Magistratisches Bezirksamt des 1. Bezirks
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Berufsrecht</h2>
          <p className="text-gray-700 leading-relaxed">
            Anwendbare Rechtsvorschriften: Gewerbeordnung 1994 (GewO), abrufbar unter{" "}
            <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              www.ris.bka.gv.at
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">UID-Nummer</h2>
          <p className="text-gray-700">ATU12345678</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Online-Streitbeilegung</h2>
          <p className="text-gray-700 leading-relaxed">
            Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>
            <br />
            Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Haftungsausschluss</h2>
          <p className="text-gray-700 leading-relaxed">
            Die Inhalte dieser Website wurden mit gr&ouml;&szlig;tm&ouml;glicher Sorgfalt erstellt. F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte kann jedoch keine Gew&auml;hr &uuml;bernommen werden. Als Diensteanbieter sind wir gem&auml;&szlig; &sect; 17 ECG f&uuml;r eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
        </section>
      </div>
    </main>
  );
}

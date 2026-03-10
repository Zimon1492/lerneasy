import Link from "next/link";

export const metadata = {
  title: "Datenschutzerklärung – LernEasy",
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO für den Betrieb dieser Plattform ist:<br />
              <strong>LernEasy e.U.</strong><br />
              E-Mail: <a href="mailto:office.lerneasy@gmail.com" className="text-blue-600 underline">office.lerneasy@gmail.com</a><br />
              Österreich
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Welche Daten wir erheben</h2>
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>

            <p className="mt-3 font-medium text-gray-800">Schülerinnen &amp; Schüler</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt), Schulinformationen (Schultyp, Schulform, Stufe, Klasse, Schulname), Adresse</li>
              <li><strong>Profilbild:</strong> Freiwillig hochgeladenes Foto, gespeichert auf unseren Servern</li>
              <li><strong>Buchungsdaten:</strong> Terminangaben, gewählte Lehrkraft, Fach, Zahlungsstatus, optionale Lernnotiz</li>
              <li><strong>Zahlungsdaten:</strong> Werden über Stripe verarbeitet. Wir speichern lediglich Referenz-IDs (Customer-ID, PaymentMethod-ID, PaymentIntent-ID), keine vollständigen Kartendaten.</li>
              <li><strong>Bewertungen:</strong> Sterne-Bewertungen und optionale Kommentare zu Lehrkräften, die öffentlich auf der Plattform sichtbar sind</li>
              <li><strong>Kommunikationsdaten:</strong> Nachrichten im Chat zwischen Schülerin/Schüler und Lehrkraft</li>
            </ul>

            <p className="mt-3 font-medium text-gray-800">Lehrerinnen &amp; Lehrer</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>Profildaten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt), Fächer, Schulform, Adresse, Profilbeschreibung, sowie optional Steuernummer / SVS-Nummer (freiwillige Angabe, wird nur intern gespeichert und nicht öffentlich angezeigt)</li>
              <li><strong>Profilbild:</strong> Freiwillig hochgeladenes Foto, gespeichert auf unseren Servern</li>
              <li><strong>Verfügbarkeitsdaten:</strong> Wochenplan und Abwesenheitszeiträume</li>
              <li><strong>Stripe Connect-Daten:</strong> Für Auszahlungen verbinden Lehrkräfte ihr Stripe Express-Konto. Wir speichern lediglich die Stripe Account-ID. Bankdaten und Identitätsdaten werden direkt an Stripe übermittelt und dort verarbeitet.</li>
              <li><strong>Kommunikationsdaten:</strong> Nachrichten im Chat mit Schülerinnen und Schülern</li>
            </ul>

            <p className="mt-3 font-medium text-gray-800">Bewerberinnen &amp; Bewerber (Lehrkraft-Bewerbung)</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>Bewerbungsdaten:</strong> Name, E-Mail-Adresse, gewünschtes Fach, Bewerbungsschreiben, hochgeladenes PDF (Zeugnis/Lebenslauf)</li>
              <li>Diese Daten werden in unserer Datenbank gespeichert und per E-Mail an die Plattformbetreiberin/den Plattformbetreiber weitergeleitet. Sie werden ausschließlich zur Bearbeitung der Bewerbung verwendet.</li>
            </ul>

            <p className="mt-3 font-medium text-gray-800">Technische Daten</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>Session-Cookies:</strong> Für den sicheren Login von Schülerinnen/Schülern und Lehrkräften (technisch notwendig, kein Einverständnis erforderlich)</li>
              <li><strong>Admin-Cookie:</strong> Für den Zugang zum Administrationsbereich (HttpOnly, 24 Stunden gültig)</li>
              <li><strong>Fehler-Logs:</strong> Bei technischen Fehlern werden Fehlermeldungen (Dateipfad, Fehlercode, Fehlertext, Zeitstempel) in der Datenbank gespeichert, ausschließlich zur Fehlerbehebung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Minderjährige</h2>
            <p>
              Die Nutzung der Plattform ist Personen ab 14 Jahren gestattet. Für Personen unter
              14 Jahren ist die ausdrückliche Zustimmung eines Erziehungsberechtigten erforderlich
              (Art. 8 DSGVO i.V.m. §&nbsp;4 Abs.&nbsp;4 DSG). Wir erheben wissentlich keine Daten
              von Kindern unter 14 Jahren ohne Zustimmung der Erziehungsberechtigten. Sollten wir
              feststellen, dass uns Daten einer Person unter 14 Jahren ohne entsprechende Einwilligung
              vorliegen, werden diese umgehend gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Cookies &amp; Einwilligung</h2>
            <p className="font-medium text-gray-800 mt-2">Technisch notwendige Cookies</p>
            <p className="mt-1">
              Für den Betrieb der Plattform erforderlich. Keine Einwilligung notwendig
              (§&nbsp;165 Abs.&nbsp;3 TKG 2021).
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                <strong>Session-Cookie (next-auth.session-token):</strong> Speichert die Login-Sitzung
                sicher als verschlüsseltes JWT. Wird beim Abmelden automatisch gelöscht.
              </li>
              <li>
                <strong>Admin-Cookie (admin_auth):</strong> Speichert die Administratoren-Sitzung
                als HttpOnly-Cookie. Gültig für 24 Stunden.
              </li>
              <li>
                <strong>Einwilligungs-Speicher (cookie_consent):</strong> Speichert deine
                Cookie-Entscheidung im localStorage (kein Server-Zugriff).
              </li>
            </ul>

            <p className="font-medium text-gray-800 mt-4">Werbe-Cookies (nur mit Einwilligung)</p>
            <p className="mt-1">
              Nur wenn du im Cookie-Banner <strong>„Alle akzeptieren"</strong> wählst, wird
              Google AdSense geladen. Google AdSense setzt eigene Cookies und kann dein
              Nutzungsverhalten plattformübergreifend verfolgen, um personalisierte Werbung
              anzuzeigen. Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO (Einwilligung).
            </p>
            <p className="mt-2">
              Du kannst deine Einwilligung jederzeit widerrufen, indem du den Browsercache
              / localStorage löschst und die Seite neu lädst – dann erscheint das Cookie-Banner
              erneut.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Zweck der Verarbeitung</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>Bereitstellung und Betrieb der Nachhilfeplattform</li>
              <li>Durchführung und Abrechnung von Buchungen</li>
              <li>Auszahlung von Vergütungen an Lehrkräfte über Stripe Connect</li>
              <li>Sichere Authentifizierung (Login/Logout)</li>
              <li>Kommunikation zwischen Schülerinnen/Schülern und Lehrkräften</li>
              <li>Versand von Buchungsbestätigungen, Erinnerungen und Benachrichtigungen per E-Mail</li>
              <li>Bearbeitung von Lehrkraft-Bewerbungen</li>
              <li>Anzeige von Bewertungen zur Qualitätssicherung</li>
              <li>Technische Fehlerbehebung und Plattformsicherheit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Rechtsgrundlage</h2>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung (Buchungen, Zahlungen, Auszahlungen, Chat)</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> – Erfüllung rechtlicher Verpflichtungen (z.B. gesetzliche Aufbewahrungsfristen für Buchungsdaten)</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigtes Interesse am sicheren Betrieb der Plattform und Fehlerbehebung (Fehler-Logs)</li>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung (Profilbild-Upload, freiwillige Angaben)</li>
              <li><strong>§ 165 Abs. 3 TKG 2021</strong> – Technisch notwendige Cookies (keine Einwilligung erforderlich)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Drittanbieter</h2>

            <p className="font-medium text-gray-800 mt-2">Stripe (Zahlungsabwicklung &amp; Auszahlungen)</p>
            <p className="mt-1">
              Für die Zahlungsabwicklung und Lehrkraft-Auszahlungen verwenden wir{" "}
              <strong>Stripe Payments Europe, Ltd.</strong> (1 Grand Canal Street Lower, Dublin 2, Irland).
              Stripe verarbeitet Zahlungs- und Bankdaten gemäß eigener Datenschutzerklärung:{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                stripe.com/de/privacy
              </a>. Lehrkräfte, die Stripe Connect nutzen, akzeptieren zusätzlich die{" "}
              <a href="https://stripe.com/de/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Stripe Connected Account Agreement
              </a>.
            </p>

            <p className="font-medium text-gray-800 mt-4">Google AdSense (Werbung)</p>
            <p className="mt-1">
              Mit deiner Einwilligung binden wir <strong>Google AdSense</strong> ein, einen
              Werbedienst der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland).
              Google AdSense verwendet Cookies, um dir relevante Werbeanzeigen anzuzeigen, und kann
              dein Nutzungsverhalten geräte- und webseitenübergreifend verfolgen. Die Datenverarbeitung
              durch Google erfolgt gemäß der{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Google-Datenschutzerklärung
              </a>. Es kann dabei zu einer Datenübermittlung in die USA kommen (Standardvertragsklauseln
              gemäß Art.&nbsp;46 DSGVO). Ohne deine Einwilligung wird kein AdSense-Code geladen.
            </p>

            <p className="font-medium text-gray-800 mt-4">E-Mail-Versand (SMTP)</p>
            <p className="mt-1">
              Für den Versand von transaktionalen E-Mails (Buchungsbestätigungen, Erinnerungen,
              Passwort-Reset-Links, Bewerbungsbenachrichtigungen) verwenden wir einen SMTP-Dienst.
              Dabei werden E-Mail-Adresse und Nachrichteninhalt zur Zustellung übermittelt. Es
              erfolgt keine Weitergabe an Dritte zu Werbezwecken.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Speicherdauer</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong>Nutzerdaten (Profil, Schuldaten, Profilbild):</strong> Werden gespeichert,
                solange das Konto aktiv ist. Nach Löschung des Kontos werden alle personenbezogenen
                Profildaten entfernt.
              </li>
              <li>
                <strong>Buchungsdaten (bezahlte Buchungen):</strong> Buchungsdatensätze mit
                Zahlungsbezug werden gemäß der gesetzlichen Aufbewahrungspflicht nach
                §&nbsp;212&nbsp;UGB <strong>7 Jahre</strong> aufbewahrt. Eine Löschung des Kontos
                führt zur Anonymisierung dieser Datensätze, nicht zu deren Löschung. Stripe bewahrt
                Zahlungsbelege unabhängig davon ebenfalls gemäß gesetzlicher Vorgaben auf.
              </li>
              <li>
                <strong>Nicht bezahlte oder stornierte Buchungen:</strong> Werden bei Kontolöschung
                entfernt.
              </li>
              <li>
                <strong>Bewerbungsdaten:</strong> Werden nach Abschluss des Bewerbungsverfahrens
                gelöscht, spätestens nach 6 Monaten.
              </li>
              <li>
                <strong>Chat-Nachrichten:</strong> Werden gespeichert, solange das Nutzerkonto
                aktiv ist. Bei Kontolöschung werden Chat-Nachrichten entfernt.
              </li>
              <li>
                <strong>Fehler-Logs:</strong> Werden nach spätestens 90 Tagen automatisch gelöscht.
              </li>
              <li>
                <strong>Profilbilder &amp; hochgeladene Dateien:</strong> Werden bei Kontolöschung
                entfernt.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Deine Rechte</h2>
            <p>Du hast folgende Rechte gemäß DSGVO:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO) – soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Widerruf einer erteilten Einwilligung jederzeit mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
              <li>
                Beschwerde bei der österreichischen Datenschutzbehörde:{" "}
                <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  dsb.gv.at
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Für Anfragen wende dich an:{" "}
              <a href="mailto:office.lerneasy@gmail.com" className="text-blue-600 underline">
                office.lerneasy@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren.
              Die aktuelle Version ist stets auf dieser Seite abrufbar. Bei wesentlichen Änderungen
              werden registrierte Nutzerinnen und Nutzer per E-Mail informiert.
            </p>
            <p className="mt-1 text-gray-500">Stand: März 2026</p>
          </section>

        </div>
      </div>
    </main>
  );
}

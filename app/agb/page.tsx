export default function AgbPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
        <h1 className="text-3xl font-bold">Allgemeine Gesch&auml;ftsbedingungen (AGB)</h1>
        <p className="text-sm text-gray-500">Stand: M&auml;rz 2026</p>

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Geltungsbereich</h2>
          <p className="text-gray-700 leading-relaxed">
            Diese Allgemeinen Gesch&auml;ftsbedingungen gelten f&uuml;r alle &uuml;ber die Plattform LernApp
            (lernapp.at) vermittelten Leistungen zwischen Sch&uuml;lerinnen und Sch&uuml;lern (im Folgenden
            &bdquo;Sch&uuml;ler&ldquo;) und Lehrpersonen (im Folgenden &bdquo;Lehrer&ldquo;) sowie zwischen
            Nutzern und der LernApp e.U. (im Folgenden &bdquo;Plattformbetreiber&ldquo;).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Leistungsbeschreibung</h2>
          <p className="text-gray-700 leading-relaxed">
            LernApp ist eine digitale Vermittlungsplattform, die Sch&uuml;lern erm&ouml;glicht, qualifizierte
            Nachhilfelehrer zu finden und Unterrichtstermine zu buchen. Der Plattformbetreiber ist kein
            Vertragspartner des eigentlichen Nachhilfeverh&auml;ltnisses, sondern lediglich Vermittler
            zwischen Sch&uuml;ler und Lehrer. Der Unterrichtsvertrag kommt direkt zwischen Sch&uuml;ler
            und Lehrer zustande.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Registrierung und Nutzerkonto</h2>
          <p className="text-gray-700 leading-relaxed">
            Die Nutzung der Plattform setzt eine Registrierung voraus. Nutzer verpflichten sich,
            wahrheitsgem&auml;&szlig;e Angaben zu machen und ihre Zugangsdaten geheim zu halten. Ein
            Anspruch auf Registrierung besteht nicht. Der Plattformbetreiber beh&auml;lt sich das Recht
            vor, Konten ohne Angabe von Gr&uuml;nden zu sperren oder zu l&ouml;schen.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Die Nutzung der Plattform ist Personen ab 14 Jahren gestattet. Personen unter 14 Jahren
            d&uuml;rfen die Plattform nur mit ausdr&uuml;cklicher Zustimmung eines Erziehungsberechtigten
            nutzen. Mit der Nutzung best&auml;tigt der Sch&uuml;ler, dass er mindestens 14 Jahre alt ist
            oder dass ein Erziehungsberechtigter zugestimmt hat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Preise und Zahlung</h2>
          <p className="text-gray-700 leading-relaxed">
            Der Preis f&uuml;r Nachhilfestunden ist <strong>variabel</strong> und richtet sich nach
            der Anzahl sowie dem Durchschnitt der Bewertungen der jeweiligen Lehrkraft. Der Preis
            pro Unterrichtsstunde (60&nbsp;Minuten) wird nach folgender Formel berechnet:
          </p>
          <p className="text-gray-700 leading-relaxed mt-2 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            Preis (€/h) = 25 + 20 &times; (1 &minus; e<sup>&minus;x/15</sup>) &times; a/5
          </p>
          <p className="text-gray-700 leading-relaxed mt-2 text-sm">
            Dabei gilt: <em>x</em> = Anzahl der Bewertungen der Lehrkraft,{" "}
            <em>a</em> = Durchschnittsbewertung (1&ndash;5; Mindestwert 1 bei noch keiner Bewertung).
            Neue Lehrkräfte starten bei <strong>25,00&nbsp;&euro;/h</strong>. Mit vielen
            Top-Bewertungen (a&nbsp;=&nbsp;5) konvergiert der Preis gegen <strong>45,00&nbsp;&euro;/h</strong>.
            Der konkrete Stundenpreis wird dem Sch&uuml;ler auf der Buchungsseite angezeigt, bevor
            eine Buchung verbindlich abgeschlossen wird.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Alle Preise sind Endpreise. Die Berechnung erfolgt anteilig auf Basis von 30&nbsp;Minuten
            als Mindestbuchungsdauer. Die Zahlung erfolgt &uuml;ber den Zahlungsdienstleister Stripe.
            Mit der Buchung speichert der Sch&uuml;ler seine Zahlungsmethode. Die tats&auml;chliche
            Belastung erfolgt erst nach Best&auml;tigung durch den Lehrer. Zahlungen sind grunds&auml;tzlich
            im Voraus f&auml;llig.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Buchung und Stornierung</h2>
          <p className="text-gray-700 leading-relaxed">
            Buchungen k&ouml;nnen vom Sch&uuml;ler &uuml;ber die Plattform vorgenommen werden. Eine
            Buchungsanfrage ist bis zur Zahlung (d.&nbsp;h. bis zur Lehrerbestätigung) kostenlos
            stornierbar &ndash; die gespeicherte Zahlungsmethode wird in diesem Fall gel&ouml;scht und
            es erfolgt keine Belastung.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Nach erfolgter Zahlung (Status &bdquo;Bezahlt&ldquo;) ist eine Stornierung durch den
            Sch&uuml;ler &uuml;ber die Plattform nicht mehr m&ouml;glich. In begr&uuml;ndeten
            Ausnahmef&auml;llen kann eine R&uuml;ckerstattung direkt beim Support beantragt werden
            (lerneazy.office@gmail.com).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Lehrer k&ouml;nnen best&auml;tigte und bereits bezahlte Termine jederzeit stornieren. In
            diesem Fall wird der volle Betrag automatisch an den Sch&uuml;ler zur&uuml;ckerstattet
            (innerhalb von 5&ndash;10 Werktagen).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Widerrufsrecht (gem&auml;&szlig; FAGG)</h2>
          <p className="text-gray-700 leading-relaxed">
            Verbraucherinnen und Verbraucher (nat&uuml;rliche Personen, die zu Zwecken handeln, die
            &uuml;berwiegend weder ihrer gewerblichen noch ihrer selbstst&auml;ndigen beruflichen
            T&auml;tigkeit zugerechnet werden k&ouml;nnen) haben das Recht, binnen <strong>14 Tagen</strong>{" "}
            ohne Angabe von Gr&uuml;nden von einem Fernabsatzvertrag zur&uuml;ckzutreten. Die
            Widerrufsfrist betr&auml;gt 14 Tage ab dem Tag des Vertragsabschlusses (Zahlung der
            Buchung).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Um das Widerrufsrecht auszu&uuml;ben, m&uuml;ssen Sie uns (LernApp e.U., E-Mail:
            lerneazy.office@gmail.com) mittels einer eindeutigen Erkl&auml;rung (z.&nbsp;B. per E-Mail)
            &uuml;ber Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            <strong>Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt vorzeitig,
            wenn die Erbringung der Dienstleistung (die gebuchte Nachhilfestunde) begonnen hat und
            der Sch&uuml;ler vor Beginn der Ausf&uuml;hrung ausdr&uuml;cklich zugestimmt hat, dass
            der Unternehmer mit der Ausf&uuml;hrung der Dienstleistung vor Ablauf der Widerrufsfrist
            beginnt, und seine Kenntnis davon best&auml;tigt hat, dass er durch seine Zustimmung mit
            Beginn der Ausf&uuml;hrung der Dienstleistung sein Widerrufsrecht verliert.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Durch Akzeptieren dieser AGB bei der Buchung erkl&auml;rt sich der Sch&uuml;ler
            ausdr&uuml;cklich damit einverstanden, dass LernApp mit der Erbringung der
            Dienstleistung vor Ablauf der Widerrufsfrist beginnt, und er best&auml;tigt, dass er
            mit Beginn der Ausf&uuml;hrung sein Widerrufsrecht verliert, sobald die Dienstleistung
            vollst&auml;ndig erbracht worden ist.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Im Falle eines g&uuml;ltigen Widerrufs vor Beginn der Dienstleistung erstatten wir alle
            von Ihnen geleisteten Zahlungen unverz&uuml;glich und sp&auml;testens binnen 14 Tagen
            zur&uuml;ck.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Pflichten der Lehrer</h2>
          <p className="text-gray-700 leading-relaxed">
            Lehrer versichern, dass sie &uuml;ber die erforderliche fachliche Qualifikation
            verf&uuml;gen. Sie verpflichten sich, zugesagte Termine einzuhalten und Sch&uuml;ler
            rechtzeitig &uuml;ber etwaige Verhinderungen zu informieren. Lehrer sind als
            selbstst&auml;ndige Auftragnehmer t&auml;tig und nicht Angestellte des
            Plattformbetreibers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Bewertungen</h2>
          <p className="text-gray-700 leading-relaxed">
            Sch&uuml;ler k&ouml;nnen Lehrer nach Abschluss einer bezahlten Buchung bewerten.
            Bewertungen m&uuml;ssen wahrheitsgem&auml;&szlig; und sachlich sein. Der
            Plattformbetreiber beh&auml;lt sich das Recht vor, beleidigende oder rechtlich
            unzul&auml;ssige Bewertungen zu l&ouml;schen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Haftung</h2>
          <p className="text-gray-700 leading-relaxed">
            Der Plattformbetreiber haftet nicht f&uuml;r die fachliche Qualit&auml;t der erbrachten
            Nachhilfeleistungen, da diese ausschlie&szlig;lich zwischen Sch&uuml;ler und Lehrer
            erbracht werden. Die Haftung des Plattformbetreibers ist auf Vorsatz und grobe
            Fahrl&auml;ssigkeit beschr&auml;nkt, soweit dies gesetzlich zul&auml;ssig ist. F&uuml;r
            leichte Fahrl&auml;ssigkeit wird keine Haftung &uuml;bernommen, au&szlig;er bei
            Verletzung wesentlicher Vertragspflichten oder Personensch&auml;den.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">10. Datenschutz</h2>
          <p className="text-gray-700 leading-relaxed">
            Die Verarbeitung personenbezogener Daten erfolgt gem&auml;&szlig; der
            Datenschutz-Grundverordnung (DSGVO) und dem &ouml;sterreichischen Datenschutzgesetz
            (DSG). N&auml;here Informationen entnehmen Sie bitte unserer{" "}
            <a href="/datenschutz" className="text-blue-600 hover:underline">
              Datenschutzerkl&auml;rung
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">11. &Auml;nderungen der AGB</h2>
          <p className="text-gray-700 leading-relaxed">
            Der Plattformbetreiber beh&auml;lt sich vor, diese AGB bei sachlichem Grund zu
            &auml;ndern. Wesentliche &Auml;nderungen werden registrierten Nutzern
            <strong> mindestens 2 Monate vor Inkrafttreten</strong> per E-Mail mitgeteilt
            (gem&auml;&szlig; &sect;&nbsp;6 Abs.&nbsp;1 Z&nbsp;2 KSchG). Wesentliche
            &Auml;nderungen treten erst in Kraft, wenn der Nutzer diesen beim n&auml;chsten
            Login ausdr&uuml;cklich zustimmt. Stimmt ein Nutzer ge&auml;nderten AGB nicht zu,
            hat er das Recht, seinen Vertrag bis zum Inkrafttreten der &Auml;nderungen
            kostenfrei zu beenden und sein Konto zu l&ouml;schen. Bis zur Zustimmung oder
            Beendigung gelten die bisherigen AGB fort. Nicht wesentliche, rein redaktionelle
            Korrekturen k&ouml;nnen ohne Vorankündigung vorgenommen werden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Anhang: Muster-Widerrufsformular</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            (gem&auml;&szlig; Anlage&nbsp;1 zu &sect;&nbsp;10 FAGG &ndash; nur ausf&uuml;llen
            und absenden, wenn Sie den Vertrag widerrufen wollen)
          </p>
          <div className="border border-gray-300 rounded-xl p-5 text-gray-700 text-sm space-y-3 bg-gray-50">
            <p>
              <strong>An:</strong> LernApp e.U., E-Mail: lerneazy.office@gmail.com
            </p>
            <p>
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
              &uuml;ber die Erbringung der folgenden Dienstleistung:
            </p>
            <p className="italic">Nachhilfestunde gebucht am: ___________________________</p>
            <p className="italic">Name des/der Verbraucher(s): ___________________________</p>
            <p className="italic">Anschrift des/der Verbraucher(s): ___________________________</p>
            <p className="italic">
              Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
              ___________________________
            </p>
            <p className="italic">Datum: ___________________________</p>
            <p className="text-gray-500 text-xs mt-2">(*) Unzutreffendes streichen.</p>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            Den ausgef&uuml;llten Widerruf senden Sie bitte per E-Mail an{" "}
            <a href="mailto:lerneazy.office@gmail.com" className="text-blue-600 underline">
              lerneazy.office@gmail.com
            </a>
            . Wir best&auml;tigen den Eingang Ihres Widerrufs unverz&uuml;glich.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">12. Anwendbares Recht und Gerichtsstand</h2>
          <p className="text-gray-700 leading-relaxed">
            Es gilt ausschlie&szlig;lich &ouml;sterreichisches Recht unter Ausschluss der
            Verweisungsnormen des internationalen Privatrechts sowie des UN-Kaufrechts. Soweit
            gesetzlich zul&auml;ssig, wird als Gerichtsstand Wien vereinbart. F&uuml;r Verbraucher
            gelten die gesetzlichen Gerichtsstands&shy;regelungen gem&auml;&szlig; &sect;&nbsp;14
            KSchG.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">13. Salvatorische Klausel</h2>
          <p className="text-gray-700 leading-relaxed">
            Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchf&uuml;hrbar sein oder
            werden, bleibt die Wirksamkeit der &uuml;brigen Bestimmungen davon unber&uuml;hrt. An
            die Stelle der unwirksamen Bestimmung tritt eine wirksame Regelung, die dem
            wirtschaftlichen Zweck der unwirksamen Bestimmung am n&auml;chsten kommt.
          </p>
        </section>
      </div>
    </main>
  );
}

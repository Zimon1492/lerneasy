/**
 * Dynamische Preisformel für Nachhilfestunden.
 *
 * f(x) = o + (m-o) * (1 - e^(-x/n)) * a/5
 *
 * x = Anzahl der Bewertungen
 * a = Durchschnittsbewertung (1–5), Minimalwert 1 wenn noch keine Bewertungen
 * o = Startpreis (default 25)
 * m = Maximalpreis (default 45)
 * n = Wachstumskonstante (default 15)
 *
 * Neue Lehrkräfte (x=0) starten bei o €/h.
 * Mit vielen Top-Bewertungen (x→∞, a=5) konvergiert der Preis gegen m €/h.
 *
 * Ergebnis: Preis pro Stunde in EUR (gerundet auf 2 Dezimalstellen)
 */
export function calcHourlyPrice(
  ratingCount: number,
  avgRating: number | null,
  o = 25,
  m = 45,
  n = 15
): number {
  const x = Math.max(0, ratingCount);
  const a = Math.max(1, avgRating ?? 1);
  const raw = o + (m - o) * (1 - Math.exp(-x / n)) * (a / 5);
  return Math.round(raw * 100) / 100;
}

/**
 * Berechnet den Gesamtpreis in Cent für eine Buchung.
 * durationMinutes: Dauer in Minuten
 */
export function calcPriceCents(
  durationMinutes: number,
  ratingCount: number,
  avgRating: number | null,
  o = 25,
  m = 45,
  n = 15
): number {
  const hourlyPrice = calcHourlyPrice(ratingCount, avgRating, o, m, n);
  return Math.round((durationMinutes / 60) * hourlyPrice * 100);
}

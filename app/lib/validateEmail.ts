/**
 * Prüft ob ein String eine syntaktisch gültige E-Mail-Adresse ist.
 * Kein DNS-Lookup — nur Format-Validierung.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  // RFC 5322 vereinfacht: local@domain.tld, max 254 Zeichen
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

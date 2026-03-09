/**
 * Escapes user-supplied strings before embedding them in HTML email templates.
 * Prevents XSS if an email client renders HTML/scripts from user input.
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

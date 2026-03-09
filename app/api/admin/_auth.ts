export function isAdminAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") ?? "";
  return cookieHeader.split(";").some((c) => c.trim() === "admin_auth=1");
}

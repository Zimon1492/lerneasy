// app/lib/auth.ts
// Shared helper – call in any App Router route handler to get the logged-in student.
// Returns null when the user is not authenticated or is not a student.

import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getStudentSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== "student") {
    return null;
  }
  return session.user as { id: string; email: string; name?: string | null; role: string };
}

export async function getTeacherSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== "teacher") {
    return null;
  }
  return session.user as { id: string; email: string; name?: string | null; role: string };
}

// app/lib/logError.ts
// Call from any server-side catch block to persist the error to the DB.
// Fire-and-forget safe — internal failures are silently swallowed.

import prisma from "./prisma";

export async function logError(
  filepath: string,
  err: unknown,
  errorCode?: string | number
): Promise<void> {
  try {
    const errorText =
      err instanceof Error ? err.message : String(err);
    const code = String(
      errorCode ?? (err as any)?.code ?? "UNKNOWN"
    );

    await prisma.errorLog.create({
      data: { filepath, errorCode: code, errorText },
    });
  } catch {
    // Never let logging failures propagate
  }
}

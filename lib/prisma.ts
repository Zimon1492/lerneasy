// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalAny: any = global;

export const prisma =
  globalAny.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalAny.prisma = prisma;

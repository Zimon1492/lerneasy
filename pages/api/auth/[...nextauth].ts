// pages/api/auth/[...nextauth].ts
import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { rateLimitDb } from "../../../lib/rateLimitDb";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    // ✅ LEHRER-LOGIN: NUR Teacher Tabelle
    CredentialsProvider({
      id: "teacher-credentials",
      name: "Teacher Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // Rate limit: 10 Versuche pro E-Mail pro 15 Minuten
        const key = `login:teacher:${credentials.email.toLowerCase()}`;
        const allowed = await rateLimitDb(key, 10, 15 * 60 * 1000);
        if (!allowed) throw new Error("Zu viele Anmeldeversuche. Bitte warte 15 Minuten.");

        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
        });
        if (!teacher) return null;

        const ok = await bcrypt.compare(credentials.password, teacher.password);
        if (!ok) return null;

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          role: "teacher",
        } as any;
      },
    }),

    // ✅ SCHÜLER-LOGIN: NUR User Tabelle
    CredentialsProvider({
      id: "student-credentials",
      name: "Student Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // Rate limit: 10 Versuche pro E-Mail pro 15 Minuten
        const key = `login:student:${credentials.email.toLowerCase()}`;
        const allowed = await rateLimitDb(key, 10, 15 * 60 * 1000);
        if (!allowed) throw new Error("Zu viele Anmeldeversuche. Bitte warte 15 Minuten.");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: "student",
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.email = (user as any).email;
        token.name = (user as any).name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
};

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}

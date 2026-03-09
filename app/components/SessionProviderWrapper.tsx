"use client";

import { SessionProvider } from "next-auth/react";
import CookieBanner from "./CookieBanner";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <CookieBanner />
    </SessionProvider>
  );
}

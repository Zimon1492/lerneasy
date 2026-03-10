import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "app/components/SessionProviderWrapper";
import { Analytics } from "@vercel/analytics/next";
import AdSenseLoader from "app/components/AdSenseLoader";

export const metadata: Metadata = {
  title: "LernEasy – Nachhilfetermine einfach buchen",
  description:
    "Vereinbare online deine Einzelsitzung mit einem Nachhilfelehrer deiner Wahl.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
        <Analytics />
        <AdSenseLoader />
      </body>
    </html>
  );
}

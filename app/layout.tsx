import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "app/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "LernApp – Nachhilfetermine einfach buchen",
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
      </body>
    </html>
  );
}

"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getConsent } from "./CookieBanner";

export default function AdSenseLoader() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(getConsent() === "accepted");
  }, []);

  if (!consented) return null;

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1583079032504756"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

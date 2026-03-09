"use client";

import { useEffect } from "react";
import { getConsent } from "./CookieBanner";

export default function AdSenseLoader() {
  useEffect(() => {
    if (getConsent() !== "accepted") return;
    const script = document.createElement("script");
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1583079032504756";
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  return null;
}

import type { NextConfig } from "next";

const securityHeaders = [
  // Verhindert Clickjacking (einbetten als iframe)
  { key: "X-Frame-Options",        value: "SAMEORIGIN" },
  // Verhindert MIME-Type-Sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Erzwingt HTTPS für 2 Jahre inkl. Subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Kein Referrer bei cross-origin Requests
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  // Kein Zugriff auf Kamera/Mikrofon/GPS
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  // XSS-Schutz (CSP)
  // unsafe-inline + unsafe-eval nötig für Next.js Hydration & Tailwind
  // frame-src für Stripe Checkout
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://www.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://pagead2.googlesyndication.com https://adservice.google.com https://ep1.adtrafficquality.google wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://connect.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "app/api/admin/applications/[id]/send-contract/route": ["./contracts/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

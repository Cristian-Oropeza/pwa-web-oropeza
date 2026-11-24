import type { NextConfig } from "next";

// Content Security Policy estricta.
// Permite emotion inline styles (necesario para MUI); bloquea todo lo demas.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js dev; en prod se puede endurecer
  "style-src 'self' 'unsafe-inline'", // MUI/emotion requiere esto
  "img-src 'self' data: blob:", // data: para el QR del 2FA
  "font-src 'self' data:",
  "connect-src 'self'", // solo mismo origen (proxy -> backend va server-side)
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

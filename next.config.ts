import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Google Analytics is loaded only when NEXT_PUBLIC_GA_ID is set (see analytics.tsx).
const GA = "https://www.googletagmanager.com https://*.google-analytics.com";

// CSP without nonces (keeps pages static/ISR): Next's inline RSC scripts need
// 'unsafe-inline'. Frames are limited to the map and video embeds we use.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${GA}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${GA}`,
  "font-src 'self'",
  `connect-src 'self' ${GA}`,
  "frame-src https://maps.google.com https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile / DEPLOY.md).
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Only our own storage and the stock photos used on static pages: an open
    // pattern turns the optimizer into a public image proxy.
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.SUPABASE_STORAGE_HOST ?? "ozkgdwemrszodajnqvcz.supabase.co",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
      // Stock photos on /contacto and /nosotros carry ?w=&q= query strings.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Keep staging/preview hosts out of search engines.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // Sections of the current site (www.uccipropiedades.com, Gatsby + Tokko) so
  // links and rankings survive the domain switch. Review with the client.
  async redirects() {
    return [
      { source: "/venta", destination: "/propiedades?op=venta", permanent: true },
      { source: "/alquiler", destination: "/propiedades?op=alquiler", permanent: true },
      { source: "/temporario", destination: "/contacto", permanent: true },
      { source: "/emprendimientos", destination: "/propiedades", permanent: true },
      { source: "/servicios", destination: "/nosotros", permanent: true },
      { source: "/sumate", destination: "/contacto", permanent: true },
      { source: "/novedades", destination: "/", permanent: true },
      { source: "/novedad/:slug*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

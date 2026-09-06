/** @type {import('next').NextConfig} */

// ─── Content Security Policy ──────────────────────────────────────────────
// Tuned for Next.js App Router + the third-party services used by socialfinder.ai
// (Stripe, Whop, PostHog, Crisp, Sentry, Plausible, Umami, Meta Pixel, Rewardful)
//
// F2 fix: Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
// F3 fix: poweredByHeader: false
const csp = [
  "default-src 'self'",
  // Scripts: allow inline (needed for Next.js RSC/hydration) + known third parties
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://js.stripe.com " +
    "https://*.whop.com " +
    "https://plausible.io " +
    "https://datafa.st " +
    "https://r.wdfl.co " +
    "https://*.posthog.com " +
    "https://*.crisp.chat " +
    "https://*.sentry.io " +
    "https://*.vercel-insights.com " +
    "https://www.googletagmanager.com " +
    "https://connect.facebook.net " +
    "https://analytics.tiktok.com",
  // Styles: self + inline (Tailwind/styled-components) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images: self + data URIs + S3 bucket + analytics pixels + search engines
  "img-src 'self' data: blob: https: " +
    "https://*.crisp.chat " +
    "https://www.facebook.com " +
    "https://randomuser.me " +
    "https://www.googletagmanager.com",
  // Connections: self + all analytics/service backends
  "connect-src 'self' " +
    "https://socialfinder-private.s3.amazonaws.com " +
    "https://socialfinder.s3.amazonaws.com " +
    "https://api.stripe.com " +
    "https://*.whop.com " +
    "https://plausible.io " +
    "https://datafa.st " +
    "https://api.umami.is " +
    "https://*.posthog.com " +
    "https://*.crisp.chat " +
    "https://*.sentry.io " +
    "https://*.vercel-insights.com " +
    "https://analytics.tiktok.com " +
    "wss://*.crisp.chat " +
    "wss://*.posthog.com",
  // Frames: only Stripe and Whop checkout iframes
  "frame-src https://js.stripe.com https://checkout.stripe.com https://*.whop.com",
  // No framing of this app (clickjacking protection for /app dashboard)
  "frame-ancestors 'none'",
  // Base URI locked to self
  "base-uri 'self'",
  // Form actions
  "form-action 'self' https://checkout.stripe.com https://*.whop.com",
  // No plugins
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // F2: CSP
  { key: "Content-Security-Policy", value: csp },
  // F2: X-Frame-Options (belt-and-suspenders with CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // F2: Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // F2: Referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // F2: Permissions policy — disable unneeded browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Existing HSTS — add includeSubDomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig = {
  // F3 fix: remove X-Powered-By: Next.js header
  poweredByHeader: false,

  // F2 fix: security headers on all responses
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "socialfinder-private.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "socialfinder.s3.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      }
    ];
  },
};

module.exports = nextConfig;

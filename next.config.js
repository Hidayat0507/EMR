/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enforce lint during build in CI; can be disabled locally if needed via env
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
    ],
  },
  images: {
    // Consider configuring domains for optimized images; keeping unoptimized off for prod
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.firebaseapp.com' },
      { protocol: 'https', hostname: '**.firebasestorage.googleapis.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Basic CSP; adjust as needed for analytics/fonts
          { key: 'Content-Security-Policy', value: [
            "default-src 'self'", 
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", 
            "style-src 'self' 'unsafe-inline'", 
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
          ].join('; ') },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };
    return config;
  }
};

module.exports = nextConfig;

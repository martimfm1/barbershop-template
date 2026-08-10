type WebpackConfig = {
  module?: {
    exprContextCritical?: boolean;
  };
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.56.1", "localhost:3000", "192.168.1.6"],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@tabler/icons-react", "date-fns"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.module ??= {};
      config.module.exprContextCritical = false;
    }
    return config;
  },
};

export default nextConfig;

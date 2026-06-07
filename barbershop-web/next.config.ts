import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.5'],
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn-icons-png.flaticon.com',
        },
      ],
    },
};

export default nextConfig;

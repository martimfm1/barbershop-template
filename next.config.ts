/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // some webpack configs set exprContextCritical to suppress warnings
      (config as any).module.exprContextCritical = false;
    }
    return config;
  },
};

export default nextConfig;
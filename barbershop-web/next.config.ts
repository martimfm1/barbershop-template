/** @type {import('next').NextConfig} */
const nextConfig = {
  // Diz ao Next.js para não tentar compilar estas bibliotecas pesadas de backend
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'sharp'],
  
  // (Opcional) Mantém a tua configuração de ignoreWarnings se já a tinhas
  webpack: (config) => {
      config.ignoreWarnings = [
          { module: /node_modules\/@protobufjs\/inquire\/index\.js/ },
      ];
      return config;
  },
};

export default nextConfig;
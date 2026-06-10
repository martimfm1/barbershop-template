/** @type {import('next').NextConfig} */


const nextConfig = {

  serverExternalPackages: ["@whiskeysockets/baileys", "pino", "sharp"],

webpack: (config: any) => {
  config.ignoreWarnings = [
    { module: /node_modules\/@protobufjs\/inquire\/index\.js/ },
  ];

  return config;
},
};

export default nextConfig;

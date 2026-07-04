/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Chromium serverless : ne pas tenter de bundler ces paquets natifs/lourds.
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  },
};

export default nextConfig;

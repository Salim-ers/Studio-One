/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ne pas bundler ces paquets natifs/lourds…
    serverComponentsExternalPackages: ["@sparticuz/chromium", "playwright-core"],
    // …mais forcer l'inclusion du binaire Chromium dans la fonction de capture
    // (le tracing ne copie pas les assets binaires tout seul).
    outputFileTracingIncludes: {
      "/api/capture": ["./node_modules/@sparticuz/chromium/**"],
    },
  },
};

export default nextConfig;

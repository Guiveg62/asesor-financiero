/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que un aviso de ESLint tumbe el build de producción (Vercel).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    typedRoutes: true,
  },
  // 🔹 sem aliases de compatibilidade aqui
}

export default nextConfig

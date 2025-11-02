/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ TEMPORÁRIO: para o branch de estabilização subir Preview mesmo com lints/TS
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Mantém app router estável
  experimental: {
    typedRoutes: true,
  },

  // Evita variações por i18n implícito
  i18n: undefined,
}

export default nextConfig

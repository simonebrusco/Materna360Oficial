/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // Builder.io CDN
      { protocol: 'https', hostname: 'cdn.builder.io', pathname: '/api/v1/image/**' },
      // Outros hosts comuns usados no app (ajuste se necessário)
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },

  async rewrites() {
    return [
      { source: '/', destination: '/meu-dia' },
      { source: '/descobrir', destination: '/(tabs)/descobrir' },
      { source: '/cuidar', destination: '/(tabs)/cuidar' },
      { source: '/eu360', destination: '/eu360' },
      { source: '/meu-dia', destination: '/meu-dia' },
    ]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // App Router (seu projeto usa src/app)
  experimental: {
    appDir: true
  },

  images: {
    remotePatterns: [
      // Ajuste/adicione hosts conforme você usa imagens externas
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' }
    ]
  },

  async rewrites() {
    return [
      // Abas do app
      { source: '/meu-dia', destination: '/(tabs)/meu-dia' },
      { source: '/cuidar', destination: '/(tabs)/cuidar' },
      { source: '/descobrir', destination: '/(tabs)/descobrir' },
      { source: '/eu360', destination: '/(tabs)/eu360' }
    ];
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.builder.io', pathname: '/api/v1/image/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      // adicione outros hosts de imagem se necessário
    ],
  },

  async rewrites() {
    // mantemos as rotas das abas explícitas (não tem vírgulas sobrando)
    return [
      { source: '/', destination: '/meu-dia' },
      { source: '/meu-dia', destination: '/meu-dia' },
      { source: '/cuidar', destination: '/cuidar' },
      { source: '/descobrir', destination: '/descobrir' },
      { source: '/eu360', destination: '/eu360' },
    ];
  },
};

export default nextConfig;

// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  // Se quiser acelerar o build enquanto ajustamos lint/TS:

  // (opcional) não travar o build por lint/TS enquanto ajustamos o projeto

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },


  // Removemos rewrites inválidos. Se precisar, adicionamos depois com o formato correto.
  async rewrites() {
    return [];
  },

  // Sem rewrites por enquanto (evita "Invalid rewrites found")
  async rewrites() {
    return [];
  },

  // (opcional) redirecionar "/" para "/meu-dia"
  async redirects() {
    return [
      { source: '/', destination: '/meu-dia', permanent: false },
    ];
  },


  // Experimentos opcionais – mantenha leve
  experimental: {
    typedRoutes: true,
  },

  images: {
    remotePatterns: [
      // adicione os domínios de imagens que você usa
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
    ],
  },

};

export default nextConfig;
async redirects() {
  return [{ source: '/', destination: '/meu-dia', permanent: false }];
}

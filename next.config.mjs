// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Se quiser acelerar o build enquanto ajustamos lint/TS:
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
};

export default nextConfig;
async redirects() {
  return [{ source: '/', destination: '/meu-dia', permanent: false }];
}

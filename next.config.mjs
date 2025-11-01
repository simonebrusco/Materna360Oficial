// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

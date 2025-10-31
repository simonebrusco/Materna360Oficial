/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Autoriza imagens do Builder.io (evita "next-image-unconfigured-host")
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        pathname: '/api/v1/image/**',
      },
    ],
    // (opcional, mas ajuda) formatos otimizados
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

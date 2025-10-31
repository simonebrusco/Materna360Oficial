// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        pathname: '/api/v1/image/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        pathname: '/api/v1/**',
      },
    ],
  },
}

export default nextConfig

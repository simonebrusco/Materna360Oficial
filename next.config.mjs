/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  swcMinify: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io' }],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://builder.io https://*.builder.io",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Configure webpack caching to avoid cache-related issues
    if (config.cache) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: '.next/cache/webpack',
        version: process.env.NEXT_PUBLIC_SITE_URL || 'default',
        name: `${isServer ? 'server' : 'client'}-${process.env.NODE_ENV}`,
      };
    }
    return config;
  },
};

export default nextConfig;

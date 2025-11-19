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
    // Configure webpack caching with proper versioning
    if (config.cache) {
      config.cache.version = `${isServer ? 'server' : 'client'}-${process.env.NODE_ENV || 'production'}`;
    }

    // Ensure webpack properly handles module resolution and chunking
    if (config.optimization && config.optimization.splitChunks) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          default: false,
          vendors: false,
        },
      };
    }

    return config;
  },
};

export default nextConfig;

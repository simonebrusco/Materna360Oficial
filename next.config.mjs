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
    // Disable webpack cache to prevent cache corruption issues
    config.cache = false;
    return config;
  },
};

export default nextConfig;

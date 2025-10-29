/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.builder.io', pathname: '/**' },
      { protocol: 'https', hostname: 'img.builder.io', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' }
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.NODE_ENV !== 'production'
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://*.builder.io https://builder.io" },
          { key: 'X-Frame-Options', value: 'ALLOWALL' }
        ]
      }
    ]
  }
};

export default nextConfig;

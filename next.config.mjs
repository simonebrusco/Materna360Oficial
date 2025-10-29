/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  appDir: 'src/app',
  async rewrites() {
    return [
      { source: '/(tabs)/:path*', destination: '/:path*' },
      { source: '/%28tabs%29/:path*', destination: '/:path*' },
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io' }],
  },
}
export default nextConfig

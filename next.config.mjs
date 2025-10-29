/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/(tabs)/meu-dia', destination: '/meu-dia', permanent: false },
      { source: '/%28tabs%29/meu-dia', destination: '/meu-dia', permanent: false },
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io' }],
  },
}
export default nextConfig

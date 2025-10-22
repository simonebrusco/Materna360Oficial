/** @type {import('next').NextConfig} */
const AUDIO_BASE = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        pathname: '/api/v1/image/assets/**',
      },
    ],
  },
  async rewrites() {
    return AUDIO_BASE ? [{ source: '/audio/:path*', destination: `${AUDIO_BASE}/:path*` }] : []
  },
  async headers() {
    return [
      {
        source: '/audio/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

module.exports = nextConfig

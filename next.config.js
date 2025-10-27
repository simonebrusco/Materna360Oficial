/** @type {import('next').NextConfig} */
const DEFAULT_AUDIO_BASE = 'https://swvuifjderyqsshguaxk.supabase.co/storage/v1/object/public' // public, not secret
function sanitizeBase(input) {
  return (input || '').toString().trim().replace(/\/+$/, '')
}
function isValidSupabaseUrl(url) {
  try {
    const u = new URL(url)
    return /\.supabase\.co$/.test(u.hostname)
  } catch {
    return false
  }
}
const RAW = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE || DEFAULT_AUDIO_BASE
const AUDIO_BASE = sanitizeBase(RAW)

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io', pathname: '/api/**' }],
  },
  async rewrites() {
    const rules = []

    if (isValidSupabaseUrl(AUDIO_BASE)) {
      rules.push({ source: '/audio/:path*', destination: `${AUDIO_BASE}/:path*` })
    }

    return rules
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

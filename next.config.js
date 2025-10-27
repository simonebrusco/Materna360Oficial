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
  webpack(config, { isServer }) {
    if (isServer) {
      config.output = config.output || {}
      console.log('[materna360] original server output path', config.output.path)
      config.output.chunkFilename = 'chunks/[id].js'
      console.log('[materna360] server chunkFilename set to', config.output.chunkFilename)
      console.log('[materna360] effective server output path', config.output.path)
    }

    return config
  },
}
module.exports = nextConfig

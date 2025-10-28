const AUDIO_BASE = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE ?? ''

const isValidSupabaseUrl = (url) => {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.builder.io', pathname: '/api/**' }],
  },
}

module.exports = nextConfig

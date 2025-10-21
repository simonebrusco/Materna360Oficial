/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    if (isServer) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[next.config] server chunkFilename before override:', config.output.chunkFilename)
      }
      const chunkPattern = 'chunks/[name].js'
      config.output.chunkFilename = chunkPattern
      config.output.hotUpdateChunkFilename = chunkPattern.replace('.js', '.hot-update.js')
    }
    return config
  },
}

module.exports = nextConfig

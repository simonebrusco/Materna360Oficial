/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    if (isServer) {
      config.output.chunkFilename = '[id].js'
      config.output.hotUpdateChunkFilename = 'hot/[id].[fullhash].hot-update.js'
    }

    return config
  },
}

module.exports = nextConfig

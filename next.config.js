const fs = require('fs/promises')
const path = require('path')

class MirrorServerChunksPlugin {
  apply(compiler) {
    const target = compiler.options.target
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MirrorServerChunksPlugin] target:', target)
    }

    const isNodeTarget =
      !target ||
      (typeof target === 'string' && target.startsWith('node')) ||
      (Array.isArray(target) && target.some((value) => typeof value === 'string' && value.startsWith('node')))

    if (!isNodeTarget) {
      return
    }

    compiler.hooks.afterEmit.tapPromise('MirrorServerChunksPlugin', async (compilation) => {
      const outputPath = compiler.outputPath
      const assetNames = Object.keys(compilation.assets)

      if (process.env.NODE_ENV !== 'production') {
        console.log('[MirrorServerChunksPlugin] assets available:', assetNames.slice(0, 10))
      }

      const chunkAssets = assetNames.filter((assetName) => assetName.startsWith('chunks/') && assetName.endsWith('.js'))

      if (process.env.NODE_ENV !== 'production') {
        console.log('[MirrorServerChunksPlugin] mirroring chunks:', chunkAssets)
      }

      await Promise.all(
        chunkAssets.map(async (assetName) => {
          const sourceFile = path.join(outputPath, assetName)
          const destinationFile = path.join(outputPath, path.basename(assetName))

          try {
            await fs.copyFile(sourceFile, destinationFile)
          } catch (error) {
            console.warn('[MirrorServerChunksPlugin] Failed to mirror chunk', assetName, error)
          }
        })
      )
    })
  }
}

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
      config.plugins.push(new MirrorServerChunksPlugin())
    }
    return config
  },
}

module.exports = nextConfig

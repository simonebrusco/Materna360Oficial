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

    compiler.hooks.afterEmit.tapPromise('MirrorServerChunksPlugin', async () => {
      const outputPath = compiler.outputPath
      const chunksDir = path.join(outputPath, 'chunks')

      try {
        const entries = await fs.readdir(chunksDir)
        const chunkFiles = entries.filter((file) => file.endsWith('.js'))

        if (chunkFiles.length === 0) {
          return
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log('[MirrorServerChunksPlugin] mirroring chunk files:', chunkFiles)
        }

        await Promise.all(
          chunkFiles.map(async (file) => {
            const sourceFile = path.join(chunksDir, file)
            const destinationFile = path.join(outputPath, file)

            try {
              await fs.copyFile(sourceFile, destinationFile)
            } catch (error) {
              console.warn('[MirrorServerChunksPlugin] Failed to mirror chunk', file, error)
            }
          })
        )
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('[MirrorServerChunksPlugin] Unable to read chunks directory:', error)
        }
      }
    })
  }
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins.push(new MirrorServerChunksPlugin())
    }
    return config
  },
}

module.exports = nextConfig

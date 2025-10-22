const fs = require('fs/promises')
const path = require('path')

class MirrorServerChunksPlugin {
  apply(compiler) {
    const target = compiler.options.target
    console.log('[MirrorServerChunksPlugin] target:', target)

    const isNodeTarget =
      !target ||
      (typeof target === 'string' && target.startsWith('node')) ||
      (Array.isArray(target) && target.some((value) => typeof value === 'string' && value.startsWith('node')))

    if (!isNodeTarget) {
      return
    }

    compiler.hooks.thisCompilation.tap('MirrorServerChunksPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'MirrorServerChunksPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        async () => {
          const outputPath = compiler.outputPath
          const chunkFiles = new Set(
            Array.from(compilation.chunks).flatMap((chunk) =>
              Array.from(chunk.files).filter((file) => file.startsWith('chunks/') && file.endsWith('.js'))
            )
          )

          if (chunkFiles.size === 0) {
            console.log('[MirrorServerChunksPlugin] no chunk files to mirror this cycle')
            return
          }

          console.log('[MirrorServerChunksPlugin] mirroring chunks:', Array.from(chunkFiles))

          await Promise.all(
            Array.from(chunkFiles).map(async (relativePath) => {
              const sourceFile = path.join(outputPath, relativePath)
              const destinationFile = path.join(outputPath, path.basename(relativePath))

              try {
                await fs.copyFile(sourceFile, destinationFile)
              } catch (error) {
                console.warn('[MirrorServerChunksPlugin] Failed to mirror chunk', relativePath, error)
              }
            })
          )
        }
      )
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

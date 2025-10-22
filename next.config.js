const fs = require('fs/promises')
const fsPromises = require('fs/promises')
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
          const chunksDirectory = path.join(outputPath, 'chunks')

          let entries = []
          try {
            entries = await fsPromises.readdir(chunksDirectory, { withFileTypes: true })
          } catch (error) {
            if (error?.code !== 'ENOENT') {
              console.warn('[MirrorServerChunksPlugin] Unable to read chunks directory', error)
            }
            return
          }

          const jsFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'))

          if (jsFiles.length === 0) {
            console.log('[MirrorServerChunksPlugin] no chunk files to mirror this cycle')
            return
          }

          console.log('[MirrorServerChunksPlugin] mirroring chunks:', jsFiles.map((entry) => entry.name))

          await Promise.all(
            jsFiles.map(async (entry) => {
              const sourceFile = path.join(chunksDirectory, entry.name)
              const destinationFile = path.join(outputPath, entry.name)

              try {
                await fsPromises.copyFile(sourceFile, destinationFile)
              } catch (error) {
                console.warn('[MirrorServerChunksPlugin] Failed to mirror chunk', entry.name, error)
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

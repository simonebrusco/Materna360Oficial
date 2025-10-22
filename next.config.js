class FixServerRuntimeChunkPathsPlugin {
  apply(compiler) {
    const target = compiler.options.target
    console.log('[FixServerRuntimeChunkPathsPlugin] target:', target)

    const isNodeTarget =
      !target ||
      (typeof target === 'string' && target.startsWith('node')) ||
      (Array.isArray(target) && target.some((value) => typeof value === 'string' && value.startsWith('node')))

    if (!isNodeTarget) {
      return
    }

    compiler.hooks.thisCompilation.tap('FixServerRuntimeChunkPathsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'FixServerRuntimeChunkPathsPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const assetNames = Array.from(compilation.assetsInfo.keys?.() ?? [])
          console.log('[FixServerRuntimeChunkPathsPlugin] available assets:', assetNames.slice ? assetNames.slice(0, 10) : assetNames)
          const asset = compilation.getAsset('webpack-runtime.js')
          if (!asset) {
            console.warn('[FixServerRuntimeChunkPathsPlugin] webpack-runtime.js asset not found')
            return
          }

          const originalSource = asset.source.source().toString()
          const searchValue = 'require("./" + __webpack_require__.u(chunkId))'
          const replacementValue = 'require("./chunks/" + __webpack_require__.u(chunkId))'

          if (!originalSource.includes(searchValue)) {
            console.warn('[FixServerRuntimeChunkPathsPlugin] Unexpected runtime format, skipping patch')
            return
          }

          const patchedSource = originalSource.replace(searchValue, replacementValue)

          compilation.updateAsset(
            'webpack-runtime.js',
            new compiler.webpack.sources.RawSource(patchedSource)
          )

          console.log('[FixServerRuntimeChunkPathsPlugin] Patched webpack-runtime.js to load chunks from subdirectory')
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
      config.plugins.push(new FixServerRuntimeChunkPathsPlugin())
    }
    return config
  },
}

module.exports = nextConfig

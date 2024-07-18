import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'

export async function createRemoteAssetsPlugin(
  { data: { config }, mode }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  if (!(config.remoteAssets === true || config.remoteAssets === mode))
    return

  const { VitePluginRemoteAssets, DefaultRules } = await import('vite-plugin-remote-assets')
  return VitePluginRemoteAssets({
    rules: [
      ...DefaultRules,
      {
        match: /\b(https?:\/\/image.unsplash\.com.*?)(?=[`'")\]])/gi,
        ext: '.png',
      },
    ],
    resolveMode: id => id.endsWith('index.html') ? 'relative' : '@fs',
    awaitDownload: mode === 'build',
    ...pluginOptions.remoteAssets,
  })
}

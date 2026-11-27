import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'

export async function createInspectPlugin(
  options: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  if (!options.inspect)
    return
  const { default: PluginInspect } = await import('vite-plugin-inspect')
  return PluginInspect({
    dev: true,
    build: true,
    ...pluginOptions.inspect,
  })
}

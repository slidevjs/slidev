import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export async function createStaticCopyPlugin(
  { themeRoots, addonRoots }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  const publicDirs = [...themeRoots, ...addonRoots].map(i => join(i, 'public')).filter(existsSync)
  if (!publicDirs.length)
    return
  const { viteStaticCopy } = await import('vite-plugin-static-copy')
  return viteStaticCopy({
    silent: true,
    targets: publicDirs.map(dir => ({
      src: `${dir}/*`,
      dest: 'theme',
    })),
    ...pluginOptions.staticCopy,
  })
}

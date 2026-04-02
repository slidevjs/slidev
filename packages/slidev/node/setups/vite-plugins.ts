import type { ResolvedSlidevOptions, VitePluginsSetup } from '@slidev/types'
import type { PluginOption } from 'vite'
import { loadSetups } from './load'

export default async function setupVitePlugins(options: ResolvedSlidevOptions): Promise<PluginOption> {
  const plugins = await loadSetups<VitePluginsSetup>(options.roots, 'vite-plugins.ts', [options])
  return plugins
}

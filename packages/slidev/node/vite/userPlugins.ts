import type { ResolvedSlidevOptions, VitePluginSetup } from '@slidev/types'
import type { Plugin as VitePlugin } from 'vite'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadModule } from '../utils'

export async function createUserVitePlugins(options: ResolvedSlidevOptions): Promise<VitePlugin[]> {
  const createPluginTasks = options.roots.map(async (root) => {
    const modulePath = path.join(root, 'setup', 'plugins.ts')
    if (existsSync(modulePath)) {
      const module = await loadModule(modulePath) as { default: VitePluginSetup }
      return module.default(options)
    }
    return []
  })
  return (await Promise.all(createPluginTasks)).flatMap(p => p)
}

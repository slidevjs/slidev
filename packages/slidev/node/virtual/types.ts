import type { Awaitable } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Rolldown } from 'vite'

export interface VirtualModuleTemplate {
  id: string
  getContent: (this: Rolldown.PluginContext, options: ResolvedSlidevOptions) => Awaitable<string>
}

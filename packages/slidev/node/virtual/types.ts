import type { Awaitable } from '@antfu/utils'
import type { PluginContext } from 'rollup'
import type { ResolvedSlidevOptions } from '@slidev/types'

export interface VirtualModuleTemplate {
  id: string
  getContent: (this: PluginContext, options: ResolvedSlidevOptions) => Awaitable<string>
}

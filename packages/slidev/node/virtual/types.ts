import type { Awaitable } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import type { PluginContext } from 'rollup'

export interface VirtualModuleTemplate {
  id: string
  getContent: (this: PluginContext, options: ResolvedSlidevOptions) => Awaitable<string>
}

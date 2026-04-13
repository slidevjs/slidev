import type { Awaitable } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'

export interface VirtualModuleTemplate {
  id: string
  getContent: (this: any, options: ResolvedSlidevOptions) => Awaitable<string>
}

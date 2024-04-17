import type { Awaitable } from '@antfu/utils'
import type MarkdownIt from 'markdown-it'
import type { PluginContext } from 'rollup'
import type { ResolvedSlidevOptions } from '@slidev/types'

export interface VirtualModuleTemplate {
  id: string
  getContent: (options: ResolvedSlidevOptions, ctx: VirtualModuleTempalteContext, pluginCtx: PluginContext) => Awaitable<string>
}

export interface VirtualModuleTempalteContext {
  md: MarkdownIt
  getLayouts: () => Promise<Record<string, string>>
  printTemplate: Promise<string | null>
}

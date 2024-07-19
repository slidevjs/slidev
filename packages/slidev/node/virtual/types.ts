import type { Awaitable } from '@antfu/utils'
import type MarkdownIt from 'markdown-it'
import type { PluginContext } from 'rollup'
import type { ResolvedSlidevOptions } from '@slidev/types'
import type { ShikiSetupResult } from '../setups/shiki'

export interface VirtualModuleTemplate {
  id: string
  getContent: (options: ResolvedSlidevOptions, ctx: VirtualModuleTemplateContext, pluginCtx: PluginContext) => Awaitable<string>
}

export interface VirtualModuleTemplateContext {
  md: MarkdownIt
  shiki: ShikiSetupResult
}

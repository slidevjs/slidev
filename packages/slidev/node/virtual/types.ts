import type { Awaitable } from '@antfu/utils'
import type MarkdownIt from 'markdown-it'
import type { ResolvedSlidevOptions } from '@slidev/types'

export interface VirtualModuleTemplate {
  id: string
  getContent: (options: ResolvedSlidevOptions, ctx: VirtualModuleTempalteContext) => Awaitable<string>
}

export interface VirtualModuleTempalteContext {
  md: MarkdownIt
  getLayouts: () => Promise<Record<string, string>>
  getPageTemplates: () => Promise<Record<string, string>>
}

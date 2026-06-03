import type { Awaitable } from '@antfu/utils'
import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Rolldown } from 'vite'
import type { MakeAbsoluteImportGlob } from '../utils'

export interface VirtualModuleContext extends Pick<Rolldown.PluginContext, 'resolve'> {
  makeAbsoluteImportGlob: MakeAbsoluteImportGlob
}

export interface VirtualModuleTemplate {
  id: string
  getContent: (this: VirtualModuleContext, options: ResolvedSlidevOptions) => Awaitable<string>
}

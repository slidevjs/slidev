import type { ComputedRef } from '@vue/reactivity'
import type { SlidevContextNav } from '../composables/useNav'
import type { configs } from '../env'

export interface SlidevContext {
  nav: SlidevContextNav
  configs: typeof configs
  themeConfigs: ComputedRef<typeof configs['themeConfig']>
}

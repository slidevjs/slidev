import type { ComputedRef } from '@vue/reactivity'
import type { configs } from '../env'
import type { SlidevContextNav } from '../composables/useNav'

export interface SlidevContext {
  nav: SlidevContextNav
  configs: typeof configs
  themeConfigs: ComputedRef<typeof configs['themeConfig']>
}

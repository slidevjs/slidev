import type { App } from 'vue'
import { computed, reactive, ref } from 'vue'
import type { ComputedRef } from '@vue/reactivity'
import type { configs } from '../env'
import * as nav from '../logic/nav'
import { isDark } from '../logic/dark'
import { injectionCurrentPage, injectionRenderContext, injectionSlidevContext } from '../constants'
import { useContext } from '../composables/useContext'

export type SlidevContextNavKey =
  | 'slideRoutes'
  | 'total'
  | 'path'
  | 'currentSlideNo'
  | 'currentSlideRoute'
  | 'currentLayout'
  | 'nextRoute'
  | 'prevRoute'
  | 'clicksContext'
  | 'clicks'
  | 'clicksTotal'
  | 'hasNext'
  | 'hasPrev'
  | 'rawTree'
  | 'treeWithActiveStatuses'
  | 'tree'
  | 'next'
  | 'prev'
  | 'nextSlide'
  | 'prevSlide'
  | 'goFirst'
  | 'goLast'
  | 'go'
  | 'downloadPDF'
  | 'openInEditor'

export type SlidevContextNav = Pick<typeof nav, SlidevContextNavKey>

export interface SlidevContext {
  nav: SlidevContextNav
  configs: typeof configs
  themeConfigs: ComputedRef<typeof configs['themeConfig']>
}

export function createSlidevContext() {
  return {
    install(app: App) {
      const context = reactive(useContext())
      app.provide(injectionRenderContext, ref('none'))
      app.provide(injectionSlidevContext, context)
      app.provide(injectionCurrentPage, computed(() => context.nav.currentSlideNo))

      // allows controls from postMessages
      if (__DEV__) {
        // @ts-expect-error expose global
        window.__slidev__ = context
        window.addEventListener('message', ({ data }) => {
          if (data && data.target === 'slidev') {
            if (data.type === 'navigate') {
              nav.go(+data.no, +data.clicks || 0)
            }
            else if (data.type === 'css-vars') {
              const root = document.documentElement
              for (const [key, value] of Object.entries(data.vars || {}))
                root.style.setProperty(key, value as any)
            }
            else if (data.type === 'color-schema') {
              isDark.value = data.color === 'dark'
            }
          }
        })
      }
    },
  }
}

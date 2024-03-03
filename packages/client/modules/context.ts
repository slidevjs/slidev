import type { App } from 'vue'
import { computed, reactive, ref } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import type { ComputedRef } from '@vue/reactivity'
import type { configs } from '../env'
import * as nav from '../logic/nav'
import { route } from '../logic/nav'
import { isDark } from '../logic/dark'
import { injectionCurrentPage, injectionRenderContext, injectionSlidevContext } from '../constants'
import { useContext } from '../composables/useContext'

export type SlidevContextNavKey = 'path' | 'total' | 'clicksContext' | 'clicks' | 'clicksTotal' | 'currentPage' | 'currentPath' | 'currentRoute' | 'currentSlideId' | 'currentLayout' | 'nextRoute' | 'rawTree' | 'treeWithActiveStatuses' | 'tree' | 'downloadPDF' | 'next' | 'nextSlide' | 'openInEditor' | 'prev' | 'prevSlide' | 'rawRoutes' | 'go'

export interface SlidevContextNav extends Pick<typeof nav, SlidevContextNavKey> {
  route: ComputedRef<RouteRecordRaw | RouteLocationNormalizedLoaded>
}

export interface SlidevContext {
  nav: SlidevContextNav
  configs: typeof configs
  themeConfigs: ComputedRef<typeof configs['themeConfig']>
}

export function createSlidevContext() {
  return {
    install(app: App) {
      const context = reactive(useContext(route))
      app.provide(injectionRenderContext, ref('none'))
      app.provide(injectionSlidevContext, context)
      app.provide(injectionCurrentPage, computed(() => context.nav.currentPage))

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

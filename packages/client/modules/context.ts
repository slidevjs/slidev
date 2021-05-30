import { App, computed, reactive, readonly } from 'vue'
import { objectKeys } from '@antfu/utils'
import type { UnwrapNestedRefs } from '@vue/reactivity'
import * as nav from '../logic/nav'
import { isDark } from '../logic/dark'
import { configs } from '../env'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $slidev: {
      nav: UnwrapNestedRefs<typeof nav>
      configs: typeof configs
      themeConfigs: typeof configs['themeConfig']
    }
  }
}

export default function createSlidevContext() {
  return {
    install(app: App) {
      const navObj: typeof nav = {} as any
      // need to copy over to get rid of the "Module" object type (will not unwrap)
      for (const key of objectKeys(nav)) {
        if (typeof key === 'string')
          // @ts-expect-error
          navObj[key] = nav[key]
      }
      const context = reactive({
        nav: navObj,
        configs,
        themeConfigs: computed(() => configs.themeConfig),
      })
      app.config.globalProperties.$slidev = readonly(context)

      // allows controls from postMessages
      if (__DEV__) {
        // @ts-expect-error
        window.__slidev__ = context
        window.addEventListener('message', ({ data }) => {
          if (data && data.target === 'slidev') {
            if (data.type === 'navigate') {
              context.nav.go(+data.no, +data.clicks || 0)
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

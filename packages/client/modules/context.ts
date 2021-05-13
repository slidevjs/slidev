import { App, reactive } from 'vue'
import type { UnwrapNestedRefs } from '@vue/reactivity'
import { objectKeys } from '@antfu/utils'
import * as nav from '../logic/nav'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $slidev: { nav: UnwrapNestedRefs<typeof nav> }
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
      app.config.globalProperties.$slidev = reactive({
        nav: navObj,
      })
    },
  }
}

import { App, reactive } from 'vue'
import type { UnwrapNestedRefs } from '@vue/reactivity'
import * as nav from '../logic/nav'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $slidev: { nav: UnwrapNestedRefs<typeof nav> }
  }
}

export default function createSlidevContext() {
  return {
    install(app: App) {
      app.config.globalProperties.$slidev = {
        nav: reactive({ ...nav }),
      }
    },
  }
}

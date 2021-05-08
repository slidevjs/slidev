import { App } from 'vue'
import * as nav from '../logic/nav'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $slidev: {nav: typeof nav}
  }
}

export default function createSlidevContext() {
  return {
    install(app: App) {
      app.config.globalProperties.$slidev = {
        nav,
      }
    },
  }
}

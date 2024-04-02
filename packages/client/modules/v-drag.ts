import type { App } from 'vue'

/**
 * This supports v-mark directive to add notations to elements, powered by `rough-notation`.
 */
export function createVMarkDirective() {
  return {
    install(app: App) {
      app.directive('drag', {
        // @ts-expect-error extra prop
        name: 'v-drag',

        mounted: () => {

        },
      })
    },
  }
}

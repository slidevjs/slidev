import { computed, App, InjectionKey, inject, ref, ComputedRef } from 'vue'
import { Fn, useMagicKeys, whenever } from '@vueuse/core'
import { Router } from 'vue-router'

export interface NavigateControls {
  next: Fn
  prev: Fn
  hasNext: ComputedRef<boolean>
  hasPrev: ComputedRef<boolean>
  install(app: App): void
}

export const NavigateControlsInjection = Symbol('navigate-controls') as InjectionKey<NavigateControls>

export function createNavigateControls(router: Router) {
  const route = router.currentRoute
  const routes = router.options.routes.filter(i => !i.redirect)
  const path = computed(() => route.value.path)

  const counter = ref(parseInt(path.value.split(/\//g)[1]) || 0)

  router.afterEach(() => {
    counter.value = parseInt(path.value.split(/\//g)[1]) || 0
  })

  const hasNext = computed(() => counter.value < routes.length - 1)
  const hasPrev = computed(() => counter.value > 0)

  function next() {
    counter.value = Math.min(routes.length - 1, counter.value + 1)
    router.push(`/${counter.value}`)
  }

  function prev() {
    counter.value = Math.max(0, counter.value - 1)
    router.push(`/${counter.value}`)
  }

  const { space, right, left } = useMagicKeys()

  whenever(space, next)
  whenever(right, next)
  whenever(left, prev)

  const navigateControls: NavigateControls = {
    next,
    prev,
    hasNext,
    hasPrev,
    install(app: App) {
      app.provide(NavigateControlsInjection, navigateControls)
    },
  }

  return navigateControls
}

export function useNavigateControls() {
  return inject(NavigateControlsInjection)!
}

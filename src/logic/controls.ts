import { computed, App, InjectionKey, inject, ref, ComputedRef, Ref } from 'vue'
import { Fn, useMagicKeys, whenever } from '@vueuse/core'
import { Router, RouteRecordRaw } from 'vue-router'
import { clickCurrent, clickElements } from '../modules/directives'

export interface NavigateControls {
  next: Fn
  prev: Fn
  nextSlide: Fn
  prevSlide: Fn
  routes: RouteRecordRaw[]
  current: ComputedRef<RouteRecordRaw | undefined>
  currentPath: ComputedRef<string>
  paused: Ref<boolean>
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
  const paused = ref(false)

  router.afterEach(() => {
    counter.value = parseInt(path.value.split(/\//g)[1]) || 0
  })

  const hasNext = computed(() => counter.value < routes.length - 1)
  const hasPrev = computed(() => counter.value > 0)

  const currentPath = computed(() => `/${counter.value}`)
  const current = computed(() => routes.find(i => i.path === currentPath.value))

  function next() {
    if (clickElements.value.length <= clickCurrent.value)
      nextSlide()
    else
      clickCurrent.value += 1
  }

  function prev() {
    if (clickCurrent.value <= 0)
      prevSlide()
    else
      clickCurrent.value -= 1
  }

  function nextSlide() {
    clickCurrent.value = 0
    clickElements.value = []
    counter.value = Math.min(routes.length - 1, counter.value + 1)
    router.push(`/${counter.value}`)
  }

  function prevSlide() {
    clickCurrent.value = 0
    clickElements.value = []
    counter.value = Math.max(0, counter.value - 1)
    router.push(`/${counter.value}`)
  }

  const { space, right, left } = useMagicKeys()

  whenever(() => space.value && !paused.value, next)
  whenever(() => right.value && !paused.value, next)
  whenever(() => left.value && !paused.value, prev)

  const navigateControls: NavigateControls = {
    next,
    prev,
    nextSlide,
    prevSlide,
    current,
    currentPath,
    paused,
    hasNext,
    hasPrev,
    routes,
    install(app: App) {
      app.provide(NavigateControlsInjection, navigateControls)
    },
  }

  return navigateControls
}

export function useNavigateControls() {
  return inject(NavigateControlsInjection)!
}

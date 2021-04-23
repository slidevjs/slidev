import { computed, App, InjectionKey, inject, ref, ComputedRef, Ref } from 'vue'
import { and, Fn, not, whenever } from '@vueuse/core'
import { Router, RouteRecordRaw } from 'vue-router'
import { clickCurrent, clickElements } from '../modules/directives'
import { isInputing, magicKeys } from './state'

declare module 'vue-router' {
  interface RouteMeta {
    layout: string
    slide?: {
      id: number
    }
  }
}

export interface NavigateControls {
  next: Fn
  prev: Fn
  nextSlide: Fn
  prevSlide: Fn
  routes: RouteRecordRaw[]
  currentRoute: ComputedRef<RouteRecordRaw | undefined>
  currentPath: ComputedRef<string>
  currentPage: ComputedRef<number>
  paused: Ref<boolean>
  hasNext: ComputedRef<boolean>
  hasPrev: ComputedRef<boolean>
  install(app: App): void
}

export const NavigateControlsInjection = Symbol('navigate-controls') as InjectionKey<NavigateControls>

export function createNavigateControls(router: Router) {
  const route = router.currentRoute
  const routes = router.options.routes.filter(i => !i.redirect)
  const paused = ref(false)

  const path = computed(() => route.value.path)
  const currentPage = computed(() => parseInt(path.value.split(/\//g)[1]) || 0)
  const currentPath = computed(() => `/${currentPage.value}`)
  const currentRoute = computed(() => routes.find(i => i.path === currentPath.value))
  const hasNext = computed(() => currentPage.value < routes.length - 1)
  const hasPrev = computed(() => currentPage.value > 0)

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
    const next = Math.min(routes.length - 1, currentPage.value + 1)
    router.push(`/${next}${location.search}`)
  }

  function prevSlide() {
    clickCurrent.value = 0
    clickElements.value = []
    const next = Math.max(0, currentPage.value - 1)
    router.push(`/${next}${location.search}`)
  }

  const shortcutEnabled = and(not(paused), not(isInputing))

  whenever(and(magicKeys.space, shortcutEnabled), next)
  whenever(and(magicKeys.right, shortcutEnabled), next)
  whenever(and(magicKeys.left, shortcutEnabled), prev)
  whenever(and(magicKeys.up, shortcutEnabled), prevSlide)
  whenever(and(magicKeys.down, shortcutEnabled), nextSlide)

  const navigateControls: NavigateControls = {
    next,
    prev,
    nextSlide,
    prevSlide,
    currentRoute,
    currentPath,
    paused,
    hasNext,
    hasPrev,
    routes,
    currentPage,
    install(app: App) {
      app.provide(NavigateControlsInjection, navigateControls)
    },
  }

  return navigateControls
}

export function useNavigateControls() {
  return inject(NavigateControlsInjection)!
}

import { computed, App, InjectionKey, inject, ref, ComputedRef, Ref, watch } from 'vue'
import { and, Fn, not, whenever } from '@vueuse/core'
import { Router, RouteRecordRaw } from 'vue-router'
import { clickCurrent, clickElements } from '../logic'
import { isInputing, magicKeys } from '../state'
import { rawRoutes } from '../routes'
// @ts-expect-error
import serverState from '/@server-ref/state'

declare module 'vue-router' {
  interface RouteMeta {
    layout: string
    slide?: {
      start: number
      end: number
      id: number
      file: string
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
  nextRoute: ComputedRef<RouteRecordRaw | undefined>
  currentPath: ComputedRef<string>
  currentPage: ComputedRef<number>
  isPresenter: ComputedRef<boolean>
  paused: Ref<boolean>
  hasNext: ComputedRef<boolean>
  hasPrev: ComputedRef<boolean>
  go(page: number): void
  install(app: App): void
}

export const NavigateControlsInjection = Symbol('navigate-controls') as InjectionKey<NavigateControls>

export function createNavigateControls(router: Router) {
  const route = router.currentRoute
  const routes = rawRoutes.filter(i => !i.redirect)
  const paused = ref(false)

  const isPresenter = computed(() => route.value.path.startsWith('/presenter'))

  const path = computed(() => route.value.path)
  const currentPage = computed(() => parseInt(path.value.split(/\//g).slice(-1)[0]) || 0)
  const currentPath = computed(() => getPath(currentPage.value))
  const currentRoute = computed(() => routes.find(i => i.path === `${currentPage.value}`))
  const hasNext = computed(() => currentPage.value < routes.length - 1)
  const hasPrev = computed(() => currentPage.value > 0)
  const nextRoute = computed(() => routes.find(i => i.path === `${Math.min(routes.length - 1, currentPage.value + 1)}`))

  router.isReady().then(() => {
    watch(serverState,
      () => {
        if (+serverState.value.page !== +currentPage.value)
          router.replace(getPath(serverState.value.page))
        clickCurrent.value = serverState.value.tab || 0
      },
      { deep: true },
    )
  })

  function updateState() {
    if (isPresenter.value) {
      serverState.value.page = +currentPage.value
      serverState.value.tab = clickCurrent.value
    }
  }

  watch(clickCurrent, updateState)

  function next() {
    if (clickElements.value.length <= clickCurrent.value)
      nextSlide()
    else
      clickCurrent.value += 1
  }

  async function prev() {
    if (clickCurrent.value <= 0)
      prevSlide()
    else
      clickCurrent.value -= 1
  }

  function getPath(no: number | string) {
    return isPresenter.value ? `/presenter/${no}` : `/${no}`
  }

  async function nextSlide() {
    const next = Math.min(routes.length - 1, currentPage.value + 1)
    go(next)
  }

  async function prevSlide() {
    const next = Math.max(0, currentPage.value - 1)
    go(next)
  }

  async function go(page: number) {
    clickCurrent.value = 0
    clickElements.value = []
    await router.push(getPath(page))
    updateState()
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
    nextRoute,
    paused,
    hasNext,
    hasPrev,
    routes,
    isPresenter,
    currentPage,
    go,
    install(app: App) {
      app.provide(NavigateControlsInjection, navigateControls)
    },
  }

  return navigateControls
}

export function useNavigateControls() {
  return inject(NavigateControlsInjection)!
}

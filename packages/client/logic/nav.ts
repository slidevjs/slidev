import type { Ref, TransitionGroupProps } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import type { SlideRoute, TocItem } from '@slidev/types'
import { timestamp, usePointerSwipe } from '@vueuse/core'
import { router } from '../routes'
import { configs } from '../env'
import { skipTransition } from '../composables/hmr'
import { usePrimaryClicks } from '../composables/useClicks'
import { CLICKS_MAX } from '../constants'
import { useRouteQuery } from './route'
import { isDrawing } from './drawings'
import { slides } from '#slidev/routes'

export { slides as slideRoutes, router }

// force update collected elements when the route is fully resolved
export const routeForceRefresh = ref(0)
nextTick(() => {
  router.afterEach(async () => {
    await nextTick()
    routeForceRefresh.value += 1
  })
})

export const navDirection = ref(0)
export const clicksDirection = ref(0)

export const route = computed(() => router.currentRoute.value)

export const isPrintMode = computed(() => route.value.query.print !== undefined)
export const isPrintWithClicks = computed(() => route.value.query.print === 'clicks')
export const isEmbedded = computed(() => route.value.query.embedded !== undefined)
export const isPresenter = computed(() => route.value.path.startsWith('/presenter'))
export const isNotesViewer = computed(() => route.value.path.startsWith('/notes'))
export const presenterPassword = computed(() => route.value.query.password)
export const showPresenter = computed(() => !isPresenter.value && (!configs.remote || presenterPassword.value === configs.remote))

const queryClicksRaw = useRouteQuery('clicks', '0')
export const queryClicks = computed({
  get() {
    // eslint-disable-next-line ts/no-use-before-define
    if (clicksContext.value.disabled)
      return CLICKS_MAX
    let v = +(queryClicksRaw.value || 0)
    if (Number.isNaN(v))
      v = 0
    return v
  },
  set(v) {
    queryClicksRaw.value = v.toString()
  },
})

export const total = computed(() => slides.value.length)
export const path = computed(() => route.value.path)

export const currentSlideNo = computed(() => slides.value.find(s =>
  s.no === +route.value.params.no || s.meta.slide?.frontmatter.routeAlias === route.value.params.no)?.no || 1)
export const currentSlideRoute = computed(() => slides.value[currentSlideNo.value - 1])
export const currentLayout = computed(() => currentSlideRoute.value?.meta?.layout || (currentSlideNo.value === 1 ? 'cover' : 'default'))

export const nextRoute = computed(() => slides.value[Math.min(slides.value.length, currentSlideNo.value + 1) - 1])
export const prevRoute = computed(() => slides.value[Math.max(1, currentSlideNo.value - 1) - 1])

export const clicksContext = computed(() => usePrimaryClicks(currentSlideRoute.value))
export const clicks = computed(() => clicksContext.value.current)
export const clicksTotal = computed(() => clicksContext.value.total)

export const hasNext = computed(() => currentSlideNo.value < slides.value.length || clicks.value < clicksTotal.value)
export const hasPrev = computed(() => currentSlideNo.value > 1 || clicks.value > 0)

export const rawTree = computed(() => slides.value
  .filter((route: SlideRoute) => route.meta?.slide?.title)
  .reduce((acc: TocItem[], route: SlideRoute) => {
    addToTree(acc, route)
    return acc
  }, []))
export const treeWithActiveStatuses = computed(() => getTreeWithActiveStatuses(rawTree.value, currentSlideRoute.value))
export const tree = computed(() => filterTree(treeWithActiveStatuses.value))

export const transition = computed(() => getCurrentTransition(navDirection.value, currentSlideRoute.value, prevRoute.value))

watch(currentSlideRoute, (next, prev) => {
  navDirection.value = next.no - prev.no
})

export async function next() {
  clicksDirection.value = 1
  if (clicksTotal.value <= queryClicks.value)
    await nextSlide()
  else
    queryClicks.value += 1
}

export async function prev() {
  clicksDirection.value = -1
  if (queryClicks.value <= 0)
    await prevSlide()
  else
    queryClicks.value -= 1
}

export function getPath(no: number | string) {
  return isPresenter.value ? `/presenter/${no}` : `/${no}`
}

export async function nextSlide() {
  clicksDirection.value = 1
  if (currentSlideNo.value < slides.value.length)
    await go(currentSlideNo.value + 1)
}

export async function prevSlide(lastClicks = true) {
  clicksDirection.value = -1
  const next = Math.max(1, currentSlideNo.value - 1)
  await go(next)
  if (lastClicks && clicksTotal.value)
    router.replace({ query: { ...route.value.query, clicks: clicksTotal.value } })
}

export function goFirst() {
  return go(1)
}

export function goLast() {
  return go(total.value)
}

export function go(page: number | string, clicks?: number) {
  skipTransition.value = false
  return router.push({ path: getPath(page), query: { ...route.value.query, clicks } })
}

export function useSwipeControls(root: Ref<HTMLElement | undefined>) {
  const swipeBegin = ref(0)
  const { direction, distanceX, distanceY } = usePointerSwipe(root, {
    pointerTypes: ['touch'],
    onSwipeStart() {
      if (isDrawing.value)
        return
      swipeBegin.value = timestamp()
    },
    onSwipeEnd() {
      if (!swipeBegin.value)
        return
      if (isDrawing.value)
        return

      const x = Math.abs(distanceX.value)
      const y = Math.abs(distanceY.value)
      if (x / window.innerWidth > 0.3 || x > 75) {
        if (direction.value === 'left')
          next()
        else
          prev()
      }
      else if (y / window.innerHeight > 0.4 || y > 200) {
        if (direction.value === 'down')
          prevSlide()
        else
          nextSlide()
      }
    },
  })
}

export async function downloadPDF() {
  const { saveAs } = await import('file-saver')
  saveAs(
    typeof configs.download === 'string'
      ? configs.download
      : configs.exportFilename
        ? `${configs.exportFilename}.pdf`
        : `${import.meta.env.BASE_URL}slidev-exported.pdf`,
    `${configs.title}.pdf`,
  )
}

export async function openInEditor(url?: string) {
  if (url == null) {
    const slide = currentSlideRoute.value?.meta?.slide
    if (!slide)
      return false
    url = `${slide.filepath}:${slide.start}`
  }
  await fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`)
  return true
}

export function addToTree(tree: TocItem[], route: SlideRoute, level = 1) {
  const titleLevel = route.meta?.slide?.level
  if (titleLevel && titleLevel > level && tree.length > 0) {
    addToTree(tree[tree.length - 1].children, route, level + 1)
  }
  else {
    tree.push({
      no: route.no,
      children: [],
      level,
      path: getPath(route.meta.slide?.frontmatter?.routeAlias ?? route.no),
      hideInToc: Boolean(route.meta?.slide?.frontmatter?.hideInToc),
      title: route.meta?.slide?.title,
    })
  }
}

export function getTreeWithActiveStatuses(
  tree: TocItem[],
  currentRoute?: SlideRoute,
  hasActiveParent = false,
  parent?: TocItem,
): TocItem[] {
  return tree.map((item: TocItem) => {
    const clone = {
      ...item,
      active: item.no === currentSlideNo.value,
      hasActiveParent,
    }
    if (clone.children.length > 0)
      clone.children = getTreeWithActiveStatuses(clone.children, currentRoute, clone.active || clone.hasActiveParent, clone)
    if (parent && (clone.active || clone.activeParent))
      parent.activeParent = true
    return clone
  })
}

export function filterTree(tree: TocItem[], level = 1): TocItem[] {
  return tree
    .filter((item: TocItem) => !item.hideInToc)
    .map((item: TocItem) => ({
      ...item,
      children: filterTree(item.children, level + 1),
    }))
}

const transitionResolveMap: Record<string, string | undefined> = {
  'slide-left': 'slide-left | slide-right',
  'slide-right': 'slide-right | slide-left',
  'slide-up': 'slide-up | slide-down',
  'slide-down': 'slide-down | slide-up',
}

export function resolveTransition(transition?: string | TransitionGroupProps, isBackward = false): TransitionGroupProps | undefined {
  if (!transition)
    return undefined
  if (typeof transition === 'string') {
    transition = {
      name: transition,
    }
  }

  if (!transition.name)
    return undefined

  let name = transition.name.includes('|')
    ? transition.name
    : (transitionResolveMap[transition.name] || transition.name)

  if (name.includes('|')) {
    const [forward, backward] = name.split('|').map(i => i.trim())
    name = isBackward ? backward : forward
  }

  if (!name)
    return undefined

  return {
    ...transition,
    name,
  }
}

export function getCurrentTransition(direction: number, currentRoute?: SlideRoute, prevRoute?: SlideRoute) {
  let transition = direction > 0
    ? prevRoute?.meta?.transition
    : currentRoute?.meta?.transition
  if (!transition)
    transition = configs.transition

  return resolveTransition(transition, direction < 0)
}

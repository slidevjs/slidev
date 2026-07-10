import type { SlideRoute } from '@slidev/types'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watchEffect } from 'vue'
import configs from '#slidev/configs'

const loaded = new Set<string>()
const loading = new Set<string>()
const RE_TRAILING_SLASH = /\/$/

function resolveUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('//'))
    return url
  const base = (import.meta.env.BASE_URL || '/').replace(RE_TRAILING_SLASH, '')
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

const RETRY_LIMIT = 2
const retries = new Map<string, number>()

const preloadedCount = ref(0)
const totalImagesCount = ref(0)

/**
 * Progress of slide-image preloading, from 0 to 1 (1 when every preloadable
 * image in the deck has loaded, or when the deck has no images).
 */
export const preloadProgress = computed(() =>
  totalImagesCount.value === 0 ? 1 : preloadedCount.value / totalImagesCount.value,
)

/** Whether all preloadable slide images have finished loading. */
export const preloadComplete = computed(() => preloadProgress.value >= 1)

function preloadImage(url: string): void {
  const resolved = resolveUrl(url)
  if (loaded.has(resolved) || loading.has(resolved))
    return
  loading.add(resolved)
  const img = new Image()
  img.onload = () => {
    loading.delete(resolved)
    loaded.add(resolved)
    retries.delete(resolved)
    preloadedCount.value = loaded.size
  }
  img.onerror = () => {
    loading.delete(resolved)
    // Retry transient preload failures (e.g. flaky network) instead of silently
    // giving up; bounded so genuinely-missing assets aren't hammered.
    const attempts = retries.get(resolved) ?? 0
    if (attempts < RETRY_LIMIT) {
      retries.set(resolved, attempts + 1)
      setTimeout(preloadImage, 1000 * (attempts + 1), url)
    }
  }
  img.src = resolved
}

function preloadSlideImages(route: SlideRoute): void {
  const images = route.meta?.slide?.images
  if (images?.length) {
    for (const url of images)
      preloadImage(url)
  }
}

export function usePreloadImages(
  currentRoute: ComputedRef<SlideRoute>,
  prevRoute: ComputedRef<SlideRoute>,
  nextRoute: ComputedRef<SlideRoute>,
  slides: Ref<SlideRoute[]>,
): void {
  const config = configs.preloadImages
  if (config === false)
    return

  const ahead = (typeof config === 'object' && config?.ahead) || 3

  // Track total preloadable images across the deck for progress reporting
  watchEffect(() => {
    const all = slides.value
    if (!all?.length)
      return
    const urls = new Set<string>()
    for (const route of all) {
      for (const url of route.meta?.slide?.images ?? [])
        urls.add(resolveUrl(url))
    }
    totalImagesCount.value = urls.size
  })

  // Preload current + prev + next + look-ahead window
  watchEffect(() => {
    const current = currentRoute.value
    const all = slides.value
    if (!current || !all?.length)
      return

    preloadSlideImages(current)
    preloadSlideImages(prevRoute.value)
    preloadSlideImages(nextRoute.value)

    // Preload ahead window
    const currentIdx = current.no - 1
    for (let i = 1; i <= ahead; i++) {
      const idx = currentIdx + i
      if (idx < all.length)
        preloadSlideImages(all[idx])
    }
  })

  // Preload all remaining slides after 3s
  watchEffect((onCleanup) => {
    const all = slides.value
    const timeout = setTimeout(() => {
      if (all?.length) {
        for (const route of all)
          preloadSlideImages(route)
      }
    }, 3000)
    onCleanup(() => clearTimeout(timeout))
  })
}

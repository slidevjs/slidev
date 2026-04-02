import type { SlideRoute } from '@slidev/types'
import type { ComputedRef, Ref } from 'vue'
import configs from '#slidev/configs'
import { watchEffect } from 'vue'

const loaded = new Set<string>()
const loading = new Set<string>()

function resolveUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('//'))
    return url
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

function preloadImage(url: string): void {
  const resolved = resolveUrl(url)
  if (loaded.has(resolved) || loading.has(resolved))
    return
  loading.add(resolved)
  const img = new Image()
  img.onload = () => {
    loading.delete(resolved)
    loaded.add(resolved)
  }
  img.onerror = () => {
    loading.delete(resolved)
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

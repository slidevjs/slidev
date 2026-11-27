import { ref } from 'vue'

export const pwaCaching = ref(false)
export const pwaReady = ref(false)

export async function setupPWA() {
  if (!__SLIDEV_FEATURE_PWA__)
    return

  const { registerSW } = await import('virtual:pwa-register')

  pwaCaching.value = true

  registerSW({
    immediate: true,
    onOfflineReady() {
      pwaCaching.value = false
      pwaReady.value = true
      // Auto-dismiss "ready" indicator after 4 seconds
      setTimeout(() => {
        pwaReady.value = false
      }, 4000)
    },
    onRegisteredSW(_swUrl, _registration) {
      // SW registered; caching is in progress until onOfflineReady fires
    },
  })
}

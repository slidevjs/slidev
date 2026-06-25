import { ref } from 'vue'

export const offlineCaching = ref(false)
export const offlineReady = ref(false)

export async function setupPWA() {
  if (!__SLIDEV_FEATURE_OFFLINE__)
    return

  const { registerSW } = await import('virtual:pwa-register')

  offlineCaching.value = true

  registerSW({
    immediate: true,
    onOfflineReady() {
      offlineCaching.value = false
      offlineReady.value = true
      // Auto-dismiss "ready" indicator after 4 seconds
      setTimeout(() => {
        offlineReady.value = false
      }, 4000)
    },
    onRegisteredSW(_swUrl, _registration) {
      // SW registered; caching is in progress until onOfflineReady fires
    },
  })
}

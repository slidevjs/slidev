import { useWakeLock as useVueUseWakeLock } from '@vueuse/core'
import { watchEffect } from 'vue'
import { wakeLockEnabled } from '../state'

export function useWakeLock() {
  const { request, release } = useVueUseWakeLock()

  watchEffect((onCleanup) => {
    if (wakeLockEnabled.value)
      request('screen')
    onCleanup(release)
  })
}

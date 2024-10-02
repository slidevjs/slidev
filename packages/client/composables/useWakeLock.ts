import { useWakeLock as useVueUseWakeLock } from '@vueuse/core'
import { watch } from 'vue'
import { wakeLockEnabled } from '../state'

export function useWakeLock() {
  const { request, release } = useVueUseWakeLock()

  watch(wakeLockEnabled, (enabled) => {
    if (enabled)
      request('screen')
    else
      release()
  }, { immediate: true })
}

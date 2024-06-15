import { useWakeLock as useVueUseWakeLock } from '@vueuse/core'
import { onMounted, onUnmounted } from 'vue'

export function useWakeLock() {
  const { request, release } = useVueUseWakeLock()

  onMounted(() => {
    request('screen')
  })
  onUnmounted(() => {
    release()
  })
}

import { useInterval } from '@vueuse/core'
import { computed } from 'vue'

export function useTimer() {
  const { counter, isActive, reset, pause, resume } = useInterval(1000, { controls: true })

  const timer = computed(() => {
    const passed = counter.value
    const sec = Math.floor(passed % 60).toString().padStart(2, '0')
    const min = Math.floor(passed / 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  })

  return {
    timer,
    isTimerActive: isActive,
    resetTimer: reset,
    toggleTimer: () => (isActive.value ? pause() : resume()),
  }
}

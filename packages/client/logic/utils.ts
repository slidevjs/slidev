import { useTimestamp } from '@vueuse/core'
import { computed, ref } from 'vue'

export function useTimer() {
  const tsStart = ref(Date.now())
  const now = useTimestamp({
    interval: 1000,
  })
  const timer = computed(() => {
    const passed = (now.value - tsStart.value) / 1000
    const sec = Math.floor(passed % 60).toString().padStart(2, '0')
    const min = Math.floor(passed / 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  })
  function resetTimer() {
    tsStart.value = now.value
  }

  return {
    timer,
    resetTimer,
  }
}

export function makeId(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  return result.join('')
}

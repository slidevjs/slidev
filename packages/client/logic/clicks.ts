import { ref, computed } from 'vue'
import { query } from '../state'

export const clickElements = ref<HTMLElement[]>([])
export const clickCurrent = computed<number>({
  get() {
    let tab = +query.tab || 0
    if (isNaN(tab))
      tab = 0
    return tab
  },
  set(v) {
    query.tab = v.toString()
  },
})

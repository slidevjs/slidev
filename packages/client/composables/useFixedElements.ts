import type { FixedElementsContext } from '@slidev/types'
import { ref } from 'vue'
import { useDynamicSlideInfo } from './useSlideInfo'

export function createFixedElementsContext(no: number): FixedElementsContext {
  const { info, update } = useDynamicSlideInfo(no)
  const enabled = ref(false)
  const elements: string[] = []
  return {
    get enabled() {
      return enabled.value
    },
    enable() {
      enabled.value = true
    },
    save() {
      enabled.value = false
    },
    discard() {
      enabled.value = false
    },
    register(id) {
      elements.push(id)
    },
    unregister(id) {
      elements.splice(elements.indexOf(id), 1)
    },
    update(id, posStr) {
      const idx = elements.indexOf(id)
      if (idx < 0 || !info.value)
        return
      const oldContent = info.value.content
      const match = [...oldContent.matchAll(/<v-fixed.*?>/g)][idx]
      const start = match.index! + 8
      const end = match.index! + match[0].length - 1
      update({
        content: `${oldContent.slice(0, start)} pos="${posStr}"${oldContent.slice(end)}`,
      })
    },
  }
}

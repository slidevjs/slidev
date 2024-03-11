import { debounce } from '@antfu/utils'
import type { FixedElementsContext } from '@slidev/types'
import { computed } from 'vue'
import { showEditor } from '../state'
import { useNav } from './useNav'
import { useDynamicSlideInfo } from './useSlideInfo'

const map: Record<number, FixedElementsContext> = {}

export function useFixedElementsContext(no: number): FixedElementsContext {
  if (!(__DEV__ && __SLIDEV_FEATURE_EDITOR__)) {
    return {
      get enabled() {
        return false
      },
      register() { },
      unregister() { },
      update() { },
    }
  }

  if (map[no])
    return map[no]
  const { currentSlideNo } = useNav()
  const { info, update } = useDynamicSlideInfo(no)

  const enabled = computed(() => showEditor.value && no === currentSlideNo.value)

  const elements: string[] = []

  const save = debounce(500, async (newContent: string) => {
    await update({
      content: newContent,
      skipHmr: true,
    })
  })

  return map[no] = {
    get enabled() {
      return enabled.value
    },
    register(id) {
      elements.push(id)
    },
    unregister(id) {
      elements.splice(elements.indexOf(id), 1)
    },
    update(id, dataStr) {
      const idx = elements.indexOf(id)
      if (idx < 0 || !info.value)
        return
      const oldContent = info.value.content
      const match = [...oldContent.matchAll(/<v-fixed.*?>/g)][idx]
      const start = match.index! + 8
      const end = match.index! + match[0].length - 1
      const newContent = oldContent.slice(0, start) + dataStr + oldContent.slice(end)
      info.value = { ...info.value, content: newContent }
      save(newContent)
    },
  }
}

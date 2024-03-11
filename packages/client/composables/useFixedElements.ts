import { debounce } from '@antfu/utils'
import type { FixedElementsContext } from '@slidev/types'
import { computed, watch } from 'vue'
import { routeForceRefresh } from '../logic/route'
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
  let updates: Record<number, [number, number, string]> = {}

  const save = () => {
    if (!info.value)
      return
    if (Object.keys(updates).length === 0)
      return
    const oldContent = info.value!.content
    let i = 0
    let content = ''
    for (const [start, end, posStr] of Object.values(updates)) {
      content += oldContent.slice(i, start) + posStr
      i = end
    }
    content += oldContent.slice(i)
    update({ content })
    updates = {}
  }

  watch([enabled, routeForceRefresh], save)
  import.meta.hot?.on('vite:beforeUpdate', save)

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
    update: debounce(
      1000,
      (id: string, dataStr: string) => {
        const idx = elements.indexOf(id)
        if (idx < 0 || !info.value)
          return
        const oldContent = info.value.content
        const match = [...oldContent.matchAll(/<v-fixed.*?>/g)][idx]
        const start = match.index! + 8
        const end = match.index! + match[0].length - 1
        updates[idx] = [start, end, dataStr]
      },
    ),
  }
}

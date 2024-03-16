import { debounce } from '@antfu/utils'
import { useDynamicSlideInfo } from './useSlideInfo'

export interface FixedElementsContext {
  register: (id: string) => void
  unregister: (id: string) => void
  update: (id: string, dataStr: string) => void
  save: () => Promise<void>
}

const map: Record<number, FixedElementsContext> = {}

export function useFixedElementsContext(no: number): FixedElementsContext {
  if (!(__DEV__ && __SLIDEV_FEATURE_EDITOR__)) {
    return {
      register() { },
      unregister() { },
      update() { },
      save: async () => { },
    }
  }

  if (map[no])
    return map[no]
  const { info, update } = useDynamicSlideInfo(no)

  const elements: string[] = []

  let newContent: string | null = null
  async function save() {
    if (newContent) {
      await update({
        content: newContent,
        skipHmr: true,
      })
      newContent = null
    }
  }
  const debouncedSave = debounce(500, save)

  return map[no] = {
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
      newContent = oldContent.slice(0, start) + dataStr + oldContent.slice(end)
      info.value = { ...info.value, content: newContent }
      debouncedSave()
    },
    save,
  }
}

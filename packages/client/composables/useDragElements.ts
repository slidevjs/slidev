import { debounce } from '@antfu/utils'
import { useDynamicSlideInfo } from './useSlideInfo'

export interface DragElementsContext {
  register: (id: string) => void
  unregister: (id: string) => void
  update: (id: string, posStr: string) => void
  save: () => Promise<void>
}

const map: Record<number, DragElementsContext> = {}

export function useDragElementsContext(no: number): DragElementsContext {
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
    update(id, posStr) {
      const idx = elements.indexOf(id)
      if (idx < 0 || !info.value)
        return
      const oldContent = info.value.content
      const match = [...oldContent.matchAll(/<(v-?drag)(.*?)(?:pos=".*?")(.*?)>/ig)][idx]
      const start = match.index!
      const end = match.index! + match[0].length
      const tagContent = [
        match[1],
        match[2].trim(),
        posStr,
        match[3].trim(),
      ].filter(Boolean).join(' ')
      newContent = oldContent.slice(0, start + 1) + tagContent + oldContent.slice(end - 1)
      info.value = {
        ...info.value,
        content: newContent,
      }
      debouncedSave()
    },
    save,
  }
}

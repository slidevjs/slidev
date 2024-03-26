import { debounce, ensureSuffix } from '@antfu/utils'
import type { SlidePatch } from 'packages/types'
import { useDynamicSlideInfo } from './useSlideInfo'

export type DragElementDataSource = 'inline' | 'frontmatter'
export type DragElementMarkdownSource = [startLine: number, endLine: number, index: number]

export interface DragElementsContext {
  register: (id: string) => void
  unregister: (id: string) => void
  update: (id: string, posStr: string, type: DragElementDataSource, markdownSource?: DragElementMarkdownSource) => void
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

  const elements = new Set<string>()

  let newPatch: SlidePatch | null = null
  async function save() {
    if (newPatch) {
      await update({
        ...newPatch,
        skipHmr: true,
      })
      newPatch = null
    }
  }
  const debouncedSave = debounce(500, save)

  return map[no] = {
    register(id) {
      elements.add(id)
    },
    unregister(id) {
      elements.delete(id)
    },
    update(id, posStr, type, markdownSource) {
      if (!info.value)
        return
      if (!elements.has(id))
        throw new Error(`[Slidev] VDrag Element ${id} is not registered`)

      if (type === 'frontmatter') {
        info.value.frontmatter.dragPos ||= {}
        info.value.frontmatter.dragPos[id] = posStr
        newPatch = {
          frontmatter: info.value.frontmatter,
        }
      }
      else {
        if (!markdownSource)
          throw new Error(`[Slidev] VDrag Element ${id} is missing markdown source`)

        const [startLine, endLine, idx] = markdownSource
        const lines = info.value.content.split(/\r?\n/g)

        let section = lines.slice(startLine, endLine).join('\n')
        let replaced = false

        section = section.replace(/<(v-?drag)(.*?)>/ig, (full, tag, attrs, index) => {
          if (index === idx) {
            replaced = true
            const posMatch = attrs.match(/pos=".*?"/)
            if (!posMatch)
              return `<${tag}${ensureSuffix(' ', attrs)}pos="${posStr}">`
            const start = posMatch.index
            const end = start + posMatch[0].length
            return `<${tag}${attrs.slice(0, start)}pos="${posStr}"${attrs.slice(end)}>`
          }
          return full
        })

        if (!replaced)
          throw new Error(`[Slidev] VDrag Element ${id} is not found in the markdown source`)

        lines.splice(
          startLine,
          endLine - startLine,
          section,
        )

        const newContent = lines.join('\n')
        newPatch = {
          content: newContent,
        }
        info.value = {
          ...info.value,
          content: newContent,
        }
      }
      debouncedSave()
    },
    save,
  }
}

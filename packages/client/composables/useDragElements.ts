import { debounce, ensureSuffix } from '@antfu/utils'
import type { SlidePatch } from '@slidev/types'
import { onClickOutside, useWindowFocus } from '@vueuse/core'
import type { CSSProperties } from 'vue'
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { injectionSlideScale } from '../constants'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'
import { activeDragElement } from '../state'
import { useSlideBounds } from './useSlideBounds'
import { useDynamicSlideInfo } from './useSlideInfo'

export type DragElementDataSource = 'inline' | 'frontmatter'
/**
 * Markdown source position, injected by markdown-it plugin
 */
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

export function useDragElement(posRaw?: string | number | number[], markdownSource?: DragElementMarkdownSource) {
  const { $renderContext, $page, $frontmatter } = useSlideContext()
  const context = computed(() => useDragElementsContext($page.value))
  const scale = inject(injectionSlideScale, ref(1))
  const { left: slideLeft, top: slideTop } = useSlideBounds()

  let dataSource: DragElementDataSource = 'inline'
  let id: string = makeId()
  let pos: number[] = [Number.NaN, Number.NaN, 0]
  if (Array.isArray(posRaw)) {
    pos = posRaw
  }
  else if (typeof posRaw === 'string' && posRaw.includes(',')) {
    pos = posRaw.split(',').map(Number)
  }
  else if (posRaw != null) {
    dataSource = 'frontmatter'
    id = `${posRaw}`
    pos = $frontmatter?.dragPos?.[posRaw]?.split(',').map(Number)
  }

  if (dataSource === 'inline' && !markdownSource)
    throw new Error('[Slidev] Can not identify the source position of the v-drag element, please provide an explicit `id` prop.')

  const width = ref(pos[2])
  const x0 = ref(pos[0] + pos[2] / 2)

  const rotate = ref(pos[4] ?? 0)
  const rotateRad = computed(() => rotate.value * Math.PI / 180)
  const rotateSin = computed(() => Math.sin(rotateRad.value))
  const rotateCos = computed(() => Math.cos(rotateRad.value))

  const container = ref<HTMLElement>()
  const bounds = ref({ left: 0, top: 0, width: 0, height: 0 })
  const actualHeight = ref(0)
  function updateBounds() {
    bounds.value = container.value!.getBoundingClientRect()
    actualHeight.value = (bounds.value.width + bounds.value.height) / scale.value / (Math.abs(rotateSin.value) + Math.abs(rotateCos.value)) - width.value
  }
  watch(width, updateBounds)

  const autoHeight = posRaw != null && !Number.isFinite(pos[3])
  const configuredHeight = ref(pos[3] ?? 0)
  const height = computed({
    get: () => (autoHeight ? actualHeight.value : configuredHeight.value) || 0,
    set: v => !autoHeight && (configuredHeight.value = v),
  })
  const configuredY0 = ref(pos[1])
  const y0 = computed({
    get: () => configuredY0.value + height.value / 2,
    set: v => configuredY0.value = v - height.value / 2,
  })

  if (['slide', 'presenter'].includes($renderContext.value)) {
    onMounted(() => {
      context.value.register(id)
      updateBounds()
      if (!posRaw) {
        setTimeout(() => {
          updateBounds()
          x0.value = (bounds.value.left + bounds.value.width / 2 - slideLeft.value) / scale.value
          y0.value = (bounds.value.top - slideTop.value) / scale.value
          width.value = bounds.value.width / scale.value
          height.value = bounds.value.height / scale.value
        }, 100)
      }
    })
    onUnmounted(() => {
      context.value.unregister(id)
    })
  }

  const positionStyle = computed<CSSProperties>(() => {
    return Number.isFinite(x0.value)
      ? {
          position: 'absolute',
          padding: '10px',
          left: `${x0.value - width.value / 2}px`,
          top: `${y0.value - height.value / 2}px`,
          width: `${width.value}px`,
          height: autoHeight ? undefined : `${height.value}px`,
          transformOrigin: 'center center',
          transform: `rotate(${rotate.value}deg)`,
        }
      : {
          position: 'absolute',
          padding: '10px',
        }
  })

  watch(
    [x0, y0, width, height, rotate],
    ([l, t, w, h, r]) => {
      let posStr = [l - w / 2, t - h / 2, w].map(Math.round).join()
      if (autoHeight)
        posStr += ',_'
      else
        posStr += `,${Math.round(h)}`
      if (Math.round(r) !== 0)
        posStr += `,${Math.round(r)}`
      context.value.update(id, posStr, dataSource, markdownSource)
    },
  )

  const state = {
    id,
    dataSource,
    markdownSource,
    autoHeight,
    x0,
    y0,
    width,
    height,
    rotate,
    container,
    positionStyle,
    dragging: computed((): boolean => activeDragElement.value === state),
    startDragging(): void {
      activeDragElement.value = state
    },
    stopDragging(): void {
      if (activeDragElement.value === state)
        activeDragElement.value = null
    },
  }

  onClickOutside(container, (ev) => {
    if ((ev.target as HTMLElement | null)?.dataset?.dragId !== id)
      state.stopDragging()
  })
  watch(useWindowFocus(), (focused) => {
    if (!focused)
      state.stopDragging()
  })

  return state
}

export type DragElementState = ReturnType<typeof useDragElement>

import { debounce, ensureSuffix } from '@antfu/utils'
import type { SlidePatch } from '@slidev/types'
import { injectLocal, onClickOutside, useWindowFocus } from '@vueuse/core'
import type { CSSProperties, DirectiveBinding, InjectionKey, WatchStopHandle } from 'vue'
import { computed, ref, watch } from 'vue'
import { injectionCurrentPage, injectionFrontmatter, injectionRenderContext, injectionSlideElement, injectionSlideScale, injectionSlideZoom } from '../constants'
import { makeId } from '../logic/utils'
import { activeDragElement } from '../state'
import { directiveInject } from '../utils'
import { useSlideBounds } from './useSlideBounds'
import { useDynamicSlideInfo } from './useSlideInfo'

export type DragElementDataSource = 'frontmatter' | 'prop' | 'directive'
/**
 * Markdown source position, injected by markdown-it plugin
 */
export type DragElementMarkdownSource = [startLine: number, endLine: number, index: number]

export type DragElementsUpdater = (id: string, posStr: string, type: DragElementDataSource, markdownSource?: DragElementMarkdownSource) => void

const map: Record<number, DragElementsUpdater> = {}

export function useDragElementsUpdater(no: number) {
  if (!(__DEV__ && __SLIDEV_FEATURE_EDITOR__))
    return () => {}

  if (map[no])
    return map[no]

  const { info, update } = useDynamicSlideInfo(no)

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

  return map[no] = (id, posStr, type, markdownSource) => {
    if (!info.value)
      return

    if (type === 'frontmatter') {
      const frontmatter = info.value.frontmatter
      frontmatter.dragPos ||= {}
      if (frontmatter.dragPos[id] === posStr)
        return
      frontmatter.dragPos[id] = posStr
      newPatch = {
        frontmatter,
      }
    }
    else {
      if (!markdownSource)
        throw new Error(`[Slidev] VDrag Element ${id} is missing markdown source`)

      const [startLine, endLine, idx] = markdownSource
      const lines = info.value.content.split(/\r?\n/g)

      let section = lines.slice(startLine, endLine).join('\n')
      let replaced = false

      section = type === 'prop'
        ? section.replace(/<(v-?drag)(.*?)>/ig, (full, tag, attrs, index) => {
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
        : section.replace(/(?<![</\w])v-drag(?:=".*?")?/ig, (full, index) => {
          if (index === idx) {
            replaced = true
            return `v-drag="${posStr}"`
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
      if (info.value.content === newContent)
        return
      newPatch = {
        content: newContent,
      }
      info.value = {
        ...info.value,
        content: newContent,
      }
    }
    debouncedSave()
  }
}

export function useDragElement(directive: DirectiveBinding | null, posRaw?: string | number | number[], markdownSource?: DragElementMarkdownSource) {
  function inject<T>(key: InjectionKey<T> | string): T | undefined {
    return directive
      ? directiveInject(directive, key)
      : injectLocal(key)
  }

  const renderContext = inject(injectionRenderContext)!
  const frontmatter = inject(injectionFrontmatter) ?? {}
  const page = inject(injectionCurrentPage)!
  const updater = computed(() => useDragElementsUpdater(page.value))
  const scale = inject(injectionSlideScale) ?? ref(1)
  const zoom = inject(injectionSlideZoom) ?? ref(1)
  const { left: slideLeft, top: slideTop, stop: stopWatchBounds } = useSlideBounds(inject(injectionSlideElement) ?? ref())
  const enabled = ['slide', 'presenter'].includes(renderContext.value)

  let dataSource: DragElementDataSource = directive ? 'directive' : 'prop'
  let id: string = makeId()
  let pos: number[] | undefined
  if (Array.isArray(posRaw)) {
    pos = posRaw
  }
  else if (typeof posRaw === 'string' && posRaw.includes(',')) {
    pos = posRaw.split(',').map(Number)
  }
  else if (posRaw != null) {
    dataSource = 'frontmatter'
    id = `${posRaw}`
    posRaw = frontmatter?.dragPos?.[id]
    pos = (posRaw as string)?.split(',').map(Number)
  }

  if (dataSource !== 'frontmatter' && !markdownSource)
    throw new Error('[Slidev] Can not identify the source position of the v-drag element, please provide an explicit `id` prop.')

  const watchStopHandles: WatchStopHandle[] = [stopWatchBounds]

  const autoHeight = posRaw != null && !Number.isFinite(pos?.[3])
  pos ??= [Number.NaN, Number.NaN, 0]
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
    const rect = container.value!.getBoundingClientRect()
    bounds.value = {
      left: rect.left / zoom.value,
      top: rect.top / zoom.value,
      width: rect.width / zoom.value,
      height: rect.height / zoom.value,
    }
    actualHeight.value = ((bounds.value.width + bounds.value.height) / scale.value / (Math.abs(rotateSin.value) + Math.abs(rotateCos.value)) - width.value)
  }
  watchStopHandles.push(watch(width, updateBounds, { flush: 'post' }))

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

  const containerStyle = computed<CSSProperties>(() => {
    return Number.isFinite(x0.value)
      ? {
          position: 'absolute',
          zIndex: 100,
          left: `${x0.value - width.value / 2}px`,
          top: `${y0.value - height.value / 2}px`,
          width: `${width.value}px`,
          height: autoHeight ? undefined : `${height.value}px`,
          transformOrigin: 'center center',
          transform: `rotate(${rotate.value}deg)`,
        }
      : {
          position: 'absolute',
          zIndex: 100,
        }
  })

  watchStopHandles.push(
    watch(
      [x0, y0, width, height, rotate],
      ([x0, y0, w, h, r]) => {
        let posStr = [x0 - w / 2, y0 - h / 2, w].map(Math.round).join()
        if (autoHeight)
          posStr += dataSource === 'directive' ? ',NaN' : ',_'
        else
          posStr += `,${Math.round(h)}`
        if (Math.round(r) !== 0)
          posStr += `,${Math.round(r)}`

        if (dataSource === 'directive')
          posStr = `[${posStr}]`

        updater.value(id, posStr, dataSource, markdownSource)
      },
    ),
  )

  const state = {
    id,
    dataSource,
    markdownSource,
    zoom,
    autoHeight,
    x0,
    y0,
    width,
    height,
    rotate,
    container,
    containerStyle,
    watchStopHandles,
    dragging: computed((): boolean => activeDragElement.value === state),
    mounted() {
      if (!enabled)
        return
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
    },
    unmounted() {
      if (!enabled)
        return
      state.stopDragging()
    },
    startDragging(): void {
      updateBounds()
      activeDragElement.value = state
    },
    stopDragging(): void {
      if (activeDragElement.value === state)
        activeDragElement.value = null
    },
  }

  watchStopHandles.push(
    onClickOutside(container, (ev) => {
      if ((ev.target as HTMLElement | null)?.dataset?.dragId !== id)
        state.stopDragging()
    }),
    watch(useWindowFocus(), (focused) => {
      if (!focused)
        state.stopDragging()
    }),
  )

  return state
}

export type DragElementState = ReturnType<typeof useDragElement>

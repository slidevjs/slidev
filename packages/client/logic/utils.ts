import { ref, computed, unref } from 'vue'
import type { Ref } from 'vue'
import { MaybeElementRef, MaybeRef, toRefs, useEventListener, useTimestamp } from '@vueuse/core'

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

export interface Position {
  x: number
  y: number
}

export interface UseDraggableOptions {
  /**
   * Only start the dragging when click on the element directly
   *
   * @default false
   */
  exact?: MaybeRef<boolean>

  /**
   * Prevent events defaults
   *
   * @default false
   */
  preventDefault?: MaybeRef<boolean>

  /**
   * Element to attach `pointermove` and `pointerup` events to.
   *
   * @default document
   */
  draggingElement?: MaybeElementRef

  /**
   * Input listen to the type of input.
   *
   * @default ['mouse', 'touch', 'pen']
   */
  inputTypes?: ('mouse' | 'touch' | 'pen')[]

  /**
   * Initial position of the element.
   */
  initial?: MaybeRef<Position>

  onMove?: (position: Position, event: PointerEvent) => void
}

export function useDraggable(el: MaybeElementRef, options: UseDraggableOptions = {}) {
  const draggingElement = options.draggingElement ?? window
  const position: Ref<Position> = ref(options.initial ?? { x: 0, y: 0 })
  const pressedDelta = ref<Position>()

  const filterEvent = (e: PointerEvent) => {
    if (options.inputTypes)
      return options.inputTypes.includes(e.pointerType as 'mouse' | 'touch' | 'pen')
    return true
  }
  const preventDefault = (e: PointerEvent) => {
    if (unref(options.preventDefault))
      e.preventDefault()
  }
  const start = (e: PointerEvent) => {
    if (!filterEvent(e))
      return
    if (unref(options.exact) && e.target !== el.value)
      return
    const react = el.value!.getBoundingClientRect()
    pressedDelta.value = {
      x: e.pageX - react.left,
      y: e.pageY - react.top,
    }
    preventDefault(e)
  }
  const move = (e: PointerEvent) => {
    if (!filterEvent(e))
      return
    if (!pressedDelta.value)
      return
    position.value = {
      x: e.pageX - pressedDelta.value.x,
      y: e.pageY - pressedDelta.value.y,
    }
    options.onMove?.(position.value, e)
    preventDefault(e)
  }
  const end = (e: PointerEvent) => {
    if (!filterEvent(e))
      return
    pressedDelta.value = undefined
    preventDefault(e)
  }

  useEventListener(el, 'pointerdown', start, true)
  useEventListener(draggingElement, 'pointermove', move, true)
  useEventListener(draggingElement, 'pointerup', end, true)

  return {
    ...toRefs(position),
    position,
    isDragging: computed(() => !!pressedDelta.value),
    style: computed(() => `left:${position.value.x}px;top:${position.value.y}px;`),
  }
}

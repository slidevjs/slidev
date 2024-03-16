<script setup lang="ts">
import { clamp } from '@antfu/utils'
import type { Pausable } from '@vueuse/core'
import { onClickOutside, useIntervalFn, useWindowFocus } from '@vueuse/core'
import type { StyleValue } from 'vue'
import { computed, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useFixedElementsContext } from '../composables/useFixedElements'
import { useNav } from '../composables/useNav'
import { useSlideBounds } from '../composables/useSlideBounds'
import { injectionSlideScale } from '../constants'
import { useSlideContext } from '../context'
import { slideHeight, slideWidth } from '../env'
import { makeId } from '../logic/utils'
import { draggingFixedElement, magicKeys } from '../state'

const props = defineProps<{
  pos?: string
}>()

const id = makeId()

const { $renderContext, $page } = useSlideContext()
const { currentSlideNo } = useNav()
const context = computed(() => useFixedElementsContext($page.value))
const enabled = computed(() => __DEV__ && $page.value === currentSlideNo.value && ['slide', 'presenter'].includes($renderContext.value))
const dragging = ref(false)
const scale = inject(injectionSlideScale, ref(1))
const { left: slideLeft, top: slideTop } = useSlideBounds()

const cornerSize = 10
const minSize = 40

const container = ref<HTMLElement>()
const pos = props.pos?.split(',').map(Number) ?? [-1, -1, 0, 0]
const left = ref(pos[0])
const top = ref(pos[1])
const right = ref(pos[0] + pos[2])
const bottom = ref(pos[1] + pos[3])

if (['slide', 'presenter'].includes($renderContext.value)) {
  onMounted(() => {
    context.value.register(id)
    if (!props.pos) {
      setTimeout(() => {
        const bounds = container.value!.getBoundingClientRect()
        console.warn(bounds, slideLeft.value)
        left.value = (bounds.left - slideLeft.value) / scale.value
        top.value = (bounds.top - slideTop.value) / scale.value
        right.value = (bounds.right - slideLeft.value) / scale.value
        bottom.value = (bounds.bottom - slideTop.value) / scale.value
      }, 100)
    }
  })
  onUnmounted(() => context.value.unregister(id))
}

const positionStyles = computed((): StyleValue => {
  return left.value >= 0
    ? {
        position: 'absolute',
        padding: '10px',
        left: `${left.value}px`,
        top: `${top.value}px`,
        width: `${right.value - left.value}px`,
        height: `${bottom.value - top.value}px`,
      }
    : {
        position: 'absolute',
        padding: '10px',
      }
})

let pressedDelta: [number, number] | undefined

function onPointerdown(ev: PointerEvent) {
  if (!enabled.value)
    return

  ev.preventDefault()
  ev.stopPropagation()
  const el = ev.target as HTMLElement
  const elBounds = el.getBoundingClientRect()
  pressedDelta = [
    ev.clientX - elBounds.left,
    ev.clientY - elBounds.top,
  ];
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
}

function onPointermove(ev: PointerEvent) {
  if (!pressedDelta)
    return

  ev.preventDefault()
  ev.stopPropagation()

  const x = (ev.clientX - slideLeft.value - pressedDelta[0]) / scale.value
  const y = (ev.clientY - slideTop.value - pressedDelta[1]) / scale.value

  const width = right.value - left.value
  const height = bottom.value - top.value
  left.value = clamp(x, 0, slideWidth.value - width)
  top.value = clamp(y, 0, slideHeight.value - height)
  right.value = left.value + width
  bottom.value = top.value + height
}

function onPointerup(ev: PointerEvent) {
  if (!pressedDelta)
    return

  ev.preventDefault()
  ev.stopPropagation()

  pressedDelta = undefined
}

function getCornerProps(isLeft: boolean, isTop: boolean) {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!pressedDelta)
        return

      ev.preventDefault()
      ev.stopPropagation()

      const x = (ev.clientX - slideLeft.value - pressedDelta[0]) / scale.value + cornerSize / 2
      const y = (ev.clientY - slideTop.value - pressedDelta[1]) / scale.value + cornerSize / 2

      if (isLeft)
        left.value = clamp(x, 0, right.value - minSize)
      else
        right.value = clamp(x, left.value + minSize, slideWidth.value)

      if (isTop)
        top.value = clamp(y, 0, bottom.value - minSize)
      else
        bottom.value = clamp(y, top.value + minSize, slideHeight.value)
    },
    onPointerup,
    style: {
      width: `${cornerSize}px`,
      height: `${cornerSize}px`,
      left: isLeft ? `${-cornerSize / 2}px` : undefined,
      right: isLeft ? undefined : `${-cornerSize / 2}px`,
      top: isTop ? `${-cornerSize / 2}px` : undefined,
      bottom: isTop ? undefined : `${-cornerSize / 2}px`,
    },
    class: `absolute border border-white bg-white bg-opacity-50 ${+isLeft + +isTop === 1 ? 'cursor-sw-resize' : 'cursor-se-resize'}`,
  }
}

watch(
  [left, top, right, bottom],
  ([l, t, r, b]) => {
    const posStr = [l, t, r - l, b - t].map(Math.round).join()
    context.value.update(id, ` pos="${posStr}"`)
  },
)

function startDragging() {
  if (enabled.value) {
    dragging.value = true
    draggingFixedElement.value = true
  }
}
function stopDragging() {
  if (dragging.value) {
    dragging.value = false
    draggingFixedElement.value = false
    context.value.save()
  }
}
onClickOutside(container, stopDragging)
watch(useWindowFocus(), (focused) => {
  if (!focused)
    stopDragging()
})

const moveInterval = 40

const intervalFnOptions = {
  immediate: false,
  immediateCallback: false,
}

const moveLeft = useIntervalFn(() => {
  if (left.value <= 0)
    return
  left.value--
  right.value--
}, moveInterval, intervalFnOptions)

const moveRight = useIntervalFn(() => {
  if (right.value >= slideWidth.value)
    return
  left.value++
  right.value++
}, moveInterval, intervalFnOptions)

const moveUp = useIntervalFn(() => {
  if (top.value <= 0)
    return
  top.value--
  bottom.value--
}, moveInterval, intervalFnOptions)

const moveDown = useIntervalFn(() => {
  if (bottom.value >= slideHeight.value)
    return
  top.value++
  bottom.value++
}, moveInterval, intervalFnOptions)

watchEffect(() => {
  function shortcut(key: string, fn: Pausable) {
    if (magicKeys[key].value && dragging.value)
      fn.resume()
    else fn.pause()
  }
  shortcut('left', moveLeft)
  shortcut('right', moveRight)
  shortcut('up', moveUp)
  shortcut('down', moveDown)
})
</script>

<template>
  <div
    v-if="dragging"
    ref="container"
    :style="positionStyles"
    border="~ white"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @pointerup="onPointerup"
  >
    <slot />
    <div class="absolute inset-0 z-100">
      <template v-for="isLeft in [true, false]">
        <template v-for="isTop in [true, false]" :key="isLeft + isTop">
          <div v-bind="getCornerProps(isLeft, isTop)" />
        </template>
      </template>
    </div>
  </div>
  <div v-else ref="container" :style="positionStyles" border="~ transparent" @dblclick="startDragging">
    <slot />
  </div>
</template>

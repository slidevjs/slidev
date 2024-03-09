<script setup lang="ts">
import { clamp } from '@antfu/utils'
import { useElementBounding, watchDebounced } from '@vueuse/core'
import type { StyleValue } from 'vue'
import { computed, inject, ref, watch } from 'vue'
import { useNav } from '../composables/useNav'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import { injectionSlideElement, injectionSlideScale } from '../constants'
import { useSlideContext } from '../context'
import { slideHeight, slideWidth } from '../env'
import { draggingFixedElements } from '../state'

const props = defineProps<{
  pos?: string
}>()

const { currentSlideNo } = useNav()
const { $renderContext } = useSlideContext()
const enabled = computed(() => draggingFixedElements.value && ['slide', 'presenter'].includes($renderContext.value))

const container = ref<HTMLElement | null>(null)
const scale = inject(injectionSlideScale, ref(1))
const slideElement = inject(injectionSlideElement, ref())
const { left: slideLeft, top: slideTop } = useElementBounding(slideElement)

const cornerSize = 10
const minSize = 30

const pos = props.pos?.split(',').map(Number) ?? [0, 0, 100, 100]
const left = ref(pos[0])
const top = ref(pos[1])
const right = ref(pos[0] + pos[2])
const bottom = ref(pos[1] + pos[3])

const style = computed((): StyleValue => {
  const pos = props.pos?.split(',').map(Number)
  return pos
    ? {
        position: 'absolute',
        left: `${left.value}px`,
        top: `${top.value}px`,
        width: `${right.value - left.value}px`,
        height: `${bottom.value - top.value}px`,
      }
    : {
        position: 'absolute',
      }
})

const pressedDelta = ref<[number, number]>()

watch(enabled, () => {
  pressedDelta.value = undefined
})

function onPointerdown(ev: PointerEvent) {
  if (!enabled.value)
    return

  ev.preventDefault()
  ev.stopPropagation()
  const el = ev.target as HTMLElement
  const elBounds = el.getBoundingClientRect()
  pressedDelta.value = [
    ev.clientX - elBounds.left,
    ev.clientY - elBounds.top,
  ];
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
}

function onPointermove(ev: PointerEvent) {
  if (!pressedDelta.value)
    return

  ev.preventDefault()
  ev.stopPropagation()

  const x = (ev.clientX - slideLeft.value - pressedDelta.value[0]) / scale.value
  const y = (ev.clientY - slideTop.value - pressedDelta.value[1]) / scale.value

  const width = right.value - left.value
  const height = bottom.value - top.value
  left.value = clamp(x, 0, slideWidth.value - width)
  top.value = clamp(y, 0, slideHeight.value - height)
  right.value = left.value + width
  bottom.value = top.value + height
}

function onPointerup(ev: PointerEvent) {
  if (!pressedDelta.value)
    return

  ev.preventDefault()
  ev.stopPropagation()

  pressedDelta.value = undefined
}

function getCornerProps(isLeft: boolean, isTop: boolean) {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!pressedDelta.value)
        return

      ev.preventDefault()
      ev.stopPropagation()

      const x = (ev.clientX - slideLeft.value - pressedDelta.value[0]) / scale.value + cornerSize / 2
      const y = (ev.clientY - slideTop.value - pressedDelta.value[1]) / scale.value + cornerSize / 2

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
    class: 'absolute border border-white cursor-move bg-white bg-opacity-50',
  }
}

const { info, update } = useDynamicSlideInfo(currentSlideNo)

watchDebounced(
  [left, top, right, bottom],
  ([l, t, r, b]) => {
    const posStr = [l, t, r - l, b - t].map(Math.round).join()
    const oldContent = info.value?.content
    if (!oldContent) {
      setTimeout(() => {
        left.value += 1e-10
      }, 1000)
      return
    }
    const match = [...oldContent.matchAll(/<v-fixed.*?>/g)][0]
    const start = match.index! + 8
    const end = match.index! + match[0].length - 1
    update({
      content: `${oldContent.slice(0, start)} pos="${posStr}"${oldContent.slice(end)}`,
    })
  },
  {
    debounce: 1000,
  },
)
</script>

<template>
  <div
    ref="container" :style="style" border="~ white" @pointerdown="onPointerdown" @pointermove="onPointermove"
    @pointerup="onPointerup"
  >
    <slot />
    <div v-if="enabled" class="absolute inset-0 z-100">
      <template v-for="isLeft in [true, false]">
        <template v-for="isTop in [true, false]" :key="isLeft + isTop">
          <div v-bind="getCornerProps(isLeft, isTop)" />
        </template>
      </template>
    </div>
  </div>
</template>

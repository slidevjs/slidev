<script setup lang="ts">
import { clamp } from '@antfu/utils'
import type { Pausable } from '@vueuse/core'
import { onClickOutside, useIntervalFn, useWindowFocus } from '@vueuse/core'
import type { StyleValue } from 'vue'
import { computed, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useDragElementsContext } from '../composables/useDragElements'
import { useNav } from '../composables/useNav'
import { useSlideBounds } from '../composables/useSlideBounds'
import { injectionSlideScale } from '../constants'
import { useSlideContext } from '../context'
import { slideHeight, slideWidth } from '../env'
import { makeId } from '../logic/utils'
import { isDraggingElement, magicKeys } from '../state'

const props = defineProps<{
  pos?: string
}>()

const id = makeId()

const { $renderContext, $page } = useSlideContext()
const { currentSlideNo } = useNav()
const context = computed(() => useDragElementsContext($page.value))
const enabled = computed(() => __DEV__ && $page.value === currentSlideNo.value && ['slide', 'presenter'].includes($renderContext.value))
const dragging = ref(false)
const scale = inject(injectionSlideScale, ref(1))
const { left: slideLeft, top: slideTop } = useSlideBounds()

const ctrlSize = 10
const minSize = 40
const minRemain = 10

const container = ref<HTMLElement>()
const pos = props.pos?.split(',').map(Number) ?? [Number.NaN, Number.NaN, 0, 0]
const x0 = ref(pos[0])
const y0 = ref(pos[1])
const width = ref(pos[2])
const height = ref(pos[3])
const rotate = ref(pos[4] ?? 0)
const rotateRad = computed(() => rotate.value * Math.PI / 180)
const rotateSin = computed(() => Math.sin(rotateRad.value))
const rotateCos = computed(() => Math.cos(rotateRad.value))

const boudingWidth = computed(() => width.value * rotateCos.value + height.value * rotateSin.value)
const boudingHeight = computed(() => width.value * rotateSin.value + height.value * rotateCos.value)

const boudingLeft = computed(() => x0.value - boudingWidth.value / 2)
const boudingTop = computed(() => y0.value - boudingHeight.value / 2)
const boudingRight = computed(() => x0.value + boudingWidth.value / 2)
const boudingBottom = computed(() => y0.value + boudingHeight.value / 2)

if (['slide', 'presenter'].includes($renderContext.value)) {
  onMounted(() => {
    context.value.register(id)
    if (!props.pos) {
      setTimeout(() => {
        const bounds = container.value!.getBoundingClientRect()
        x0.value = (bounds.left + bounds.width / 2 - slideLeft.value) / scale.value
        y0.value = (bounds.top + bounds.height / 2 - slideTop.value) / scale.value
        width.value = bounds.width / scale.value
        height.value = bounds.height / scale.value
      }, 100)
    }
  })
  onUnmounted(() => context.value.unregister(id))
}

const positionStyles = computed((): StyleValue => {
  return Number.isFinite(x0.value)
    ? {
        position: 'absolute',
        padding: '10px',
        left: `${x0.value - width.value / 2}px`,
        top: `${y0.value - height.value / 2}px`,
        width: `${width.value}px`,
        height: `${height.value}px`,
        transform: `rotate(${rotate.value}deg)`,
      }
    : {
        position: 'absolute',
        padding: '10px',
      }
})

let currentDrag: {
  x0: number
  y0: number
  width: number
  height: number
  rotate: number
  dx0: number
  dy0: number
  ltx: number
  lty: number
  rtx: number
  rty: number
  lbx: number
  lby: number
  rbx: number
  rby: number
} | null = null

function onPointerdown(ev: PointerEvent) {
  if (!enabled.value)
    return

  ev.preventDefault()
  ev.stopPropagation()
  const el = ev.target as HTMLElement
  const elBounds = el.getBoundingClientRect()

  const cross1x = width.value * rotateCos.value - height.value * rotateSin.value
  const cross1y = width.value * rotateSin.value + height.value * rotateCos.value
  const cross2x = width.value * rotateCos.value + height.value * rotateSin.value
  const cross2y = -width.value * rotateSin.value + height.value * rotateCos.value

  currentDrag = {
    x0: x0.value,
    y0: y0.value,
    width: width.value,
    height: height.value,
    rotate: rotate.value,
    dx0: ev.clientX - (elBounds.left + elBounds.right) / 2,
    dy0: ev.clientY - (elBounds.top + elBounds.bottom) / 2,
    ltx: x0.value - cross1x / 2,
    lty: y0.value - cross1y / 2,
    rtx: x0.value + cross2x / 2,
    rty: y0.value - cross2y / 2,
    lbx: x0.value - cross2x / 2,
    lby: y0.value + cross2y / 2,
    rbx: x0.value + cross1x / 2,
    rby: y0.value + cross1y / 2,
  };

  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
}

function onPointermove(ev: PointerEvent) {
  if (!currentDrag)
    return

  ev.preventDefault()
  ev.stopPropagation()

  const x = (ev.clientX - slideLeft.value - currentDrag.dx0) / scale.value
  const y = (ev.clientY - slideTop.value - currentDrag.dy0) / scale.value

  x0.value = clamp(x, -boudingWidth.value / 2 + minRemain, slideWidth.value + boudingWidth.value / 2 - minRemain)
  y0.value = clamp(y, -boudingHeight.value / 2 + minRemain, slideHeight.value + boudingHeight.value / 2 - minRemain)
}

function onPointerup(ev: PointerEvent) {
  if (!currentDrag)
    return

  ev.preventDefault()
  ev.stopPropagation()

  currentDrag = null
}

const ctrlClasses = `absolute border border-white bg-white bg-opacity-50 `

function getCornerProps(isLeft: boolean, isTop: boolean) {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!currentDrag)
        return

      ev.preventDefault()
      ev.stopPropagation()

      let x = (ev.clientX - slideLeft.value) / scale.value
      let y = (ev.clientY - slideTop.value) / scale.value

      const { ltx, lty, rtx, rty, lbx, lby, rbx, rby } = currentDrag

      const ratio = currentDrag.width / currentDrag.height
      const wMin = Math.max(minSize, minSize * ratio)
      function getSize(w1: number, h1: number) {
        if (ev.shiftKey) {
          const w = Math.max(w1, h1 * ratio, wMin)
          const h = w / ratio
          return { w, h }
        }
        else {
          return { w: Math.max(w1, minSize), h: Math.max(h1, minSize) }
        }
      }

      if (isLeft) {
        if (isTop) {
          const w1 = (rbx - x) * rotateCos.value + (rby - y) * rotateSin.value
          const h1 = -(rbx - x) * rotateSin.value + (rby - y) * rotateCos.value
          const { w, h } = getSize(w1, h1)
          x = rbx - w * rotateCos.value + h * rotateSin.value
          y = rby - w * rotateSin.value - h * rotateCos.value
        }
        else {
          const w1 = (rtx - x) * rotateCos.value - (y - rty) * rotateSin.value
          const h1 = (rtx - x) * rotateSin.value + (y - rty) * rotateCos.value
          const { w, h } = getSize(w1, h1)
          x = rtx - w * rotateCos.value - h * rotateSin.value
          y = rty - w * rotateSin.value + h * rotateCos.value
        }
      }
      else {
        if (isTop) {
          const w1 = (x - lbx) * rotateCos.value - (lby - y) * rotateSin.value
          const h1 = (x - lbx) * rotateSin.value + (lby - y) * rotateCos.value
          const { w, h } = getSize(w1, h1)
          x = lbx + w * rotateCos.value + h * rotateSin.value
          y = lby + w * rotateSin.value - h * rotateCos.value
        }
        else {
          const w1 = (x - ltx) * rotateCos.value + (y - lty) * rotateSin.value
          const h1 = -(x - ltx) * rotateSin.value + (y - lty) * rotateCos.value
          const { w, h } = getSize(w1, h1)
          x = ltx + w * rotateCos.value - h * rotateSin.value
          y = lty + w * rotateSin.value + h * rotateCos.value
        }
      }

      if (isLeft) {
        if (isTop) {
          x0.value = (x + rbx) / 2
          y0.value = (y + rby) / 2
          width.value = (rbx - x) * rotateCos.value + (rby - y) * rotateSin.value
          height.value = -(rbx - x) * rotateSin.value + (rby - y) * rotateCos.value
        }
        else {
          x0.value = (x + rtx) / 2
          y0.value = (y + rty) / 2
          width.value = (rtx - x) * rotateCos.value - (y - rty) * rotateSin.value
          height.value = (rtx - x) * rotateSin.value + (y - rty) * rotateCos.value
        }
      }
      else {
        if (isTop) {
          x0.value = (x + lbx) / 2
          y0.value = (y + lby) / 2
          width.value = (x - lbx) * rotateCos.value - (lby - y) * rotateSin.value
          height.value = (x - lbx) * rotateSin.value + (lby - y) * rotateCos.value
        }
        else {
          x0.value = (x + ltx) / 2
          y0.value = (y + lty) / 2
          width.value = (x - ltx) * rotateCos.value + (y - lty) * rotateSin.value
          height.value = -(x - ltx) * rotateSin.value + (y - lty) * rotateCos.value
        }
      }
    },
    onPointerup,
    style: {
      width: `${ctrlSize}px`,
      height: `${ctrlSize}px`,
      margin: `-${ctrlSize / 2}px`,
      left: isLeft ? '0' : undefined,
      right: isLeft ? undefined : '0',
      top: isTop ? '0' : undefined,
      bottom: isTop ? undefined : '0',
      cursor: +isLeft + +isTop === 1 ? 'nesw-resize' : 'nwse-resize',
    },
    class: ctrlClasses,
  }
}

function getBorderProps(dir: 'l' | 'r' | 't' | 'b') {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!currentDrag)
        return

      ev.preventDefault()
      ev.stopPropagation()

      const x = (ev.clientX - slideLeft.value) / scale.value
      const y = (ev.clientY - slideTop.value) / scale.value

      const { ltx, lty, rtx, rty, lbx, lby, rbx, rby } = currentDrag

      if (dir === 'l') {
        const rx = (rtx + rbx) / 2
        const ry = (rty + rby) / 2
        width.value = Math.max((rx - x) * rotateCos.value + (ry - y) * rotateSin.value, minSize)
        x0.value = rx - width.value * rotateCos.value / 2
        y0.value = ry - width.value * rotateSin.value / 2
      }
      else if (dir === 'r') {
        const lx = (ltx + lbx) / 2
        const ly = (lty + lby) / 2
        width.value = Math.max((x - lx) * rotateCos.value + (y - ly) * rotateSin.value, minSize)
        x0.value = lx + width.value * rotateCos.value / 2
        y0.value = ly + width.value * rotateSin.value / 2
      }
      else if (dir === 't') {
        const bx = (lbx + rbx) / 2
        const by = (lby + rby) / 2
        height.value = Math.max((by - y) * rotateCos.value - (bx - x) * rotateSin.value, minSize)
        x0.value = bx + height.value * rotateSin.value / 2
        y0.value = by - height.value * rotateCos.value / 2
      }
      else if (dir === 'b') {
        const tx = (ltx + rtx) / 2
        const ty = (lty + rty) / 2
        height.value = Math.max((y - ty) * rotateCos.value - (x - tx) * rotateSin.value, minSize)
        x0.value = tx - height.value * rotateSin.value / 2
        y0.value = ty + height.value * rotateCos.value / 2
      }
    },
    onPointerup,
    style: {
      width: `${ctrlSize}px`,
      height: `${ctrlSize}px`,
      margin: `-${ctrlSize / 2}px`,
      left: dir === 'l' ? '0' : dir === 'r' ? `100%` : `50%`,
      top: dir === 't' ? '0' : dir === 'b' ? `100%` : `50%`,
      cursor: 'lr'.includes(dir) ? 'ew-resize' : 'ns-resize',
      borderRadius: '50%',
    },
    class: ctrlClasses,
  }
}

function getRotateProps() {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!currentDrag)
        return

      ev.preventDefault()
      ev.stopPropagation()

      const x = (ev.clientX - slideLeft.value - currentDrag.dx0) / scale.value - ctrlSize / 4
      const y = (ev.clientY - slideTop.value - currentDrag.dy0) / scale.value - ctrlSize / 4

      let angle = Math.atan2(y - y0.value, x - x0.value) * 180 / Math.PI + 90

      const commonAngles = [0, 90, 180, 270, 360]
      for (const a of commonAngles) {
        if (Math.abs(angle - a) < 5) {
          angle = a % 360
          break
        }
      }

      rotate.value = angle
    },
    onPointerup,
    style: {
      width: `${ctrlSize}px`,
      height: `${ctrlSize}px`,
      margin: `-${ctrlSize / 2}px`,
      left: '50%',
      top: '-20px',
      cursor: 'grab',
      borderRadius: '50%',
    },
    class: ctrlClasses,
  }
}

watch(
  [x0, y0, width, height, rotate],
  ([l, t, w, h, r]) => {
    let posStr = [l, t, w, h].map(Math.round).join()
    if (Math.round(r) !== 0)
      posStr += `,${Math.round(r)}`
    context.value.update(id, `pos="${posStr}"`)
  },
)

function startDragging() {
  if (enabled.value) {
    dragging.value = true
    isDraggingElement.value = true
  }
}
function stopDragging() {
  if (dragging.value) {
    dragging.value = false
    isDraggingElement.value = false
    context.value.save()
  }
}
onClickOutside(container, stopDragging)
watch(useWindowFocus(), (focused) => {
  if (!focused)
    stopDragging()
})

const moveInterval = 20

const intervalFnOptions = {
  immediate: false,
  immediateCallback: false,
}

const moveLeft = useIntervalFn(() => {
  if (boudingRight.value <= minRemain)
    return
  x0.value--
}, moveInterval, intervalFnOptions)

const moveRight = useIntervalFn(() => {
  if (boudingLeft.value >= slideWidth.value - minRemain)
    return
  x0.value++
}, moveInterval, intervalFnOptions)

const moveUp = useIntervalFn(() => {
  if (boudingBottom.value <= minRemain)
    return
  y0.value--
}, moveInterval, intervalFnOptions)

const moveDown = useIntervalFn(() => {
  if (boudingTop.value >= slideHeight.value - minRemain)
    return
  y0.value++
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
      <div v-bind="getCornerProps(true, true)" />
      <div v-bind="getCornerProps(true, false)" />
      <div v-bind="getCornerProps(false, true)" />
      <div v-bind="getCornerProps(false, false)" />
      <div v-bind="getBorderProps('l')" />
      <div v-bind="getBorderProps('r')" />
      <div v-bind="getBorderProps('t')" />
      <div v-bind="getBorderProps('b')" />
      <div v-bind="getRotateProps()" />
    </div>
  </div>
  <div v-else ref="container" :style="positionStyles" border="~ transparent" @dblclick="startDragging">
    <slot />
  </div>
</template>

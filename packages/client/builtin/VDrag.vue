<script setup lang="ts">
import { clamp } from '@antfu/utils'
import type { Pausable } from '@vueuse/core'
import { onClickOutside, useIntervalFn, useWindowFocus } from '@vueuse/core'
import type { StyleValue } from 'vue'
import { computed, inject, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import type { DragElementDataSource, DragElementMarkdownSource } from '../composables/useDragElements'
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
  id?: string
  /**
   * Markdown source position, injected by markdown-it plugin
   */
  markdownSource?: DragElementMarkdownSource
}>()

const id = props.id ?? makeId()
const dataSource: DragElementDataSource | undefined = props.pos
  ? 'inline'
  : props.id
    ? 'frontmatter'
    : props.markdownSource
      ? 'inline'
      : undefined

if (!dataSource)
  throw new Error('[Slidev] Can not identify the source position of the v-drag element, please provide an explicit `id` prop.')

const { $renderContext, $page, $frontmatter } = useSlideContext()
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
const bounds = ref({ left: 0, top: 0, width: 0, height: 0 })
const actualHeight = ref(0)
function updateBounds() {
  bounds.value = container.value!.getBoundingClientRect()
  // eslint-disable-next-line ts/no-use-before-define
  actualHeight.value = (bounds.value.width + bounds.value.height) / scale.value / (Math.abs(rotateSin.value) + Math.abs(rotateCos.value)) - width.value
}

const posStr = props.pos || $frontmatter?.dragPos?.[id]
const pos = posStr?.split(',').map(Number) ?? [Number.NaN, Number.NaN, 0]

const width = ref(pos[2])
const x0 = ref(pos[0] + pos[2] / 2)

const rotate = ref(pos[4] ?? 0)
const rotateRad = computed(() => rotate.value * Math.PI / 180)
const rotateSin = computed(() => Math.sin(rotateRad.value))
const rotateCos = computed(() => Math.cos(rotateRad.value))

const autoHeight = posStr && (!pos[3] || pos[3] === '_')
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

const boundingWidth = computed(() => width.value * rotateCos.value + height.value * rotateSin.value)
const boundingHeight = computed(() => width.value * rotateSin.value + height.value * rotateCos.value)

const boundingLeft = computed(() => x0.value - boundingWidth.value / 2)
const boundingTop = computed(() => y0.value - boundingHeight.value / 2)
const boundingRight = computed(() => x0.value + boundingWidth.value / 2)
const boundingBottom = computed(() => y0.value + boundingHeight.value / 2)

if (['slide', 'presenter'].includes($renderContext.value)) {
  onMounted(() => {
    context.value.register(id)
    updateBounds()
    if (!posStr) {
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

const positionStyles = computed((): StyleValue => {
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
  if (!enabled.value || ev.buttons !== 1)
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
  if (!currentDrag || ev.buttons !== 1)
    return

  ev.preventDefault()
  ev.stopPropagation()

  const x = (ev.clientX - slideLeft.value - currentDrag.dx0) / scale.value
  const y = (ev.clientY - slideTop.value - currentDrag.dy0) / scale.value

  x0.value = clamp(x, -boundingWidth.value / 2 + minRemain, slideWidth.value + boundingWidth.value / 2 - minRemain)
  y0.value = clamp(y, -boundingHeight.value / 2 + minRemain, slideHeight.value + boundingHeight.value / 2 - minRemain)
}

function onPointerup(ev: PointerEvent) {
  if (!currentDrag)
    return

  ev.preventDefault()
  ev.stopPropagation()

  currentDrag = null
}

const ctrlClasses = `absolute border border-gray bg-gray dark:border-gray-500 dark:bg-gray-800 bg-opacity-30 `

function getCornerProps(isLeft: boolean, isTop: boolean) {
  return {
    onPointerdown,
    onPointermove: (ev: PointerEvent) => {
      if (!currentDrag || ev.buttons !== 1)
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
      if (!currentDrag || ev.buttons !== 1)
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
      if (!currentDrag || ev.buttons !== 1)
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
    let posStr = [l - w / 2, t - h / 2, w].map(Math.round).join()
    if (autoHeight)
      posStr += ',_'
    else
      posStr += `,${Math.round(h)}`
    if (Math.round(r) !== 0)
      posStr += `,${Math.round(r)}`
    context.value.update(id, posStr, dataSource, props.markdownSource)
  },
)

function startDragging() {
  if (enabled.value) {
    dragging.value = true
    isDraggingElement.value = true
    updateBounds()
  }
}
function stopDragging() {
  if (dragging.value) {
    dragging.value = false
    isDraggingElement.value = false
    context.value.save()
  }
}
onClickOutside(container, (ev) => {
  if ((ev.target as HTMLElement | null)?.dataset?.dragId === id)
    return
  stopDragging()
})
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
  if (boundingRight.value <= minRemain)
    return
  x0.value--
}, moveInterval, intervalFnOptions)

const moveRight = useIntervalFn(() => {
  if (boundingLeft.value >= slideWidth.value - minRemain)
    return
  x0.value++
}, moveInterval, intervalFnOptions)

const moveUp = useIntervalFn(() => {
  if (boundingBottom.value <= minRemain)
    return
  y0.value--
}, moveInterval, intervalFnOptions)

const moveDown = useIntervalFn(() => {
  if (boundingTop.value >= slideHeight.value - minRemain)
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

watch([width], updateBounds)
</script>

<template>
  <div
    v-if="dragging"
    :data-drag-id="id"
    :style="positionStyles"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @pointerup="onPointerup"
  >
    <slot />
    <div class="absolute inset-0 z-100 b b-dark dark:b-gray-400">
      <template v-if="!autoHeight">
        <div v-bind="getCornerProps(true, true)" />
        <div v-bind="getCornerProps(true, false)" />
        <div v-bind="getCornerProps(false, true)" />
        <div v-bind="getCornerProps(false, false)" />
      </template>
      <div v-bind="getBorderProps('l')" />
      <div v-bind="getBorderProps('r')" />
      <template v-if="!autoHeight">
        <div v-bind="getBorderProps('t')" />
        <div v-bind="getBorderProps('b')" />
      </template>
      <div v-bind="getRotateProps()" />
      <div
        class="absolute -top-15px w-0 b b-dashed b-dark dark:b-gray-400"
        :style="{
          left: 'calc(50% - 1px)',
          height: autoHeight ? '14px' : '10px',
        }"
      />
    </div>
    <div ref="container" class="absolute inset-0 invisible" />
  </div>
  <div v-else ref="container" :style="positionStyles" @dblclick="startDragging">
    <slot />
  </div>
</template>

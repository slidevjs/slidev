<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import { CLICKS_MAX } from '../constants'

const props = withDefaults(
  defineProps<{
    class?: string | string[]
    noteHtml?: string
    note?: string
    highlight?: boolean
    placeholder?: string
    clicksContext?: ClicksContext
    autoScroll?: boolean
  }>(),
  {
    highlight: true,
  },
)

const emit = defineEmits<{
  (type: 'markerDblclick', e: MouseEvent, clicks: number): void
  (type: 'markerClick', e: MouseEvent, clicks: number): void
}>()

const CLASS_FADE = 'slidev-note-fade'
const CLASS_MARKER = 'slidev-note-click-mark'

const withClicks = computed(() => props.clicksContext != null && props.noteHtml?.includes(CLASS_MARKER))
const noteDisplay = ref<HTMLElement | null>(null)

function processNote() {
  if (!noteDisplay.value || !withClicks.value)
    return

  const markers = Array.from(noteDisplay.value.querySelectorAll(`.${CLASS_MARKER}`)) as HTMLElement[]

  const markersMap = new Map<HTMLElement, number>()
  const parentsMap = new Map<HTMLElement, [divider: HTMLElement | null, dividerClicks: number][]>()
  let lastClicks = 0
  for (const marker of markers) {
    const clicks = Number(marker.dataset!.clicks)
    markersMap.set(marker, clicks)

    // Set parent clicks map
    let n = marker
    let p = marker.parentElement
    while (p && n !== noteDisplay.value) {
      if (!parentsMap.has(p))
        parentsMap.set(p, [[null, lastClicks]])
      parentsMap.get(p)!.push([n, clicks])
      n = p
      p = p.parentElement
    }

    lastClicks = clicks
  }

  const siblingsMap = new Map<HTMLElement, number>()
  for (const [parent, dividers] of parentsMap) {
    let hasPrefix = false
    let dividerIdx = 0
    for (const sibling of Array.from(parent.childNodes)) {
      let skip = false
      while (sibling === dividers[dividerIdx + 1]?.[0]) {
        skip = true
        dividerIdx++
      }
      if (skip)
        continue

      // Convert sibling text nodes to spans
      let siblingEl = sibling as HTMLElement
      if (sibling.nodeType === 3 /* text node */) {
        if (!sibling.textContent?.trim())
          continue
        siblingEl = document.createElement('span')
        siblingEl.textContent = sibling.textContent
        parent.insertBefore(siblingEl, sibling)
        sibling.remove()
      }

      hasPrefix ||= dividerIdx === 0
      siblingsMap.set(siblingEl, dividers[dividerIdx][1])
    }
    if (!hasPrefix)
      dividers[0][1] = -1
  }

  // Apply
  return (current: number) => {
    const enabled = props.highlight
    for (const [parent, clicks] of parentsMap)
      parent.classList.toggle(CLASS_FADE, enabled && !clicks.some(([_, c]) => c === current))
    for (const [parent, clicks] of siblingsMap)
      parent.classList.toggle(CLASS_FADE, enabled && clicks !== current)
    for (const [marker, clicks] of markersMap) {
      marker.classList.remove(CLASS_FADE)
      marker.classList.toggle(`${CLASS_MARKER}-past`, enabled && clicks < current)
      marker.classList.toggle(`${CLASS_MARKER}-active`, enabled && clicks === current)
      marker.classList.toggle(`${CLASS_MARKER}-next`, enabled && clicks === current + 1)
      marker.classList.toggle(`${CLASS_MARKER}-future`, enabled && clicks > current + 1)
      marker.ondblclick = (e) => {
        if (!enabled)
          return
        emit('markerDblclick', e, clicks)
        if (e.defaultPrevented)
          return
        props.clicksContext!.current = clicks
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
      marker.onclick = (e) => {
        if (enabled) {
          emit('markerClick', e, clicks)
        }
      }

      if (enabled && props.autoScroll && clicks === current)
        marker.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }
}

const applyHighlight = ref<ReturnType<typeof processNote>>()

watch(
  () => [props.noteHtml, props.highlight],
  () => {
    nextTick(() => {
      applyHighlight.value = processNote()
    })
  },
  { immediate: true },
)

onMounted(() => {
  processNote()
})

watchEffect(() => {
  const current = props.clicksContext?.current ?? CLICKS_MAX
  applyHighlight.value?.(current)
})
</script>

<template>
  <div
    v-if="noteHtml"
    ref="noteDisplay"
    class="prose dark:prose-invert overflow-auto outline-none slidev-note"
    :class="[props.class, withClicks ? 'slidev-note-with-clicks' : '']"
    v-html="noteHtml"
  />
  <div
    v-else-if="note"
    class="prose dark:prose-invert overflow-auto outline-none slidev-note"
    :class="props.class"
  >
    <p v-text="note" />
  </div>
  <div
    v-else
    class="prose dark:prose-invert overflow-auto outline-none opacity-50 italic select-none slidev-note"
    :class="props.class"
  >
    <p v-text="props.placeholder || 'No notes.'" />
  </div>
</template>

<style>
.slidev-note :first-child {
  margin-top: 0;
}
</style>

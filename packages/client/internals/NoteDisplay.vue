<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ClicksContext } from '@slidev/types'
import { CLICKS_MAX } from '../constants'

const props = defineProps<{
  class?: string
  noteHtml?: string
  note?: string
  placeholder?: string
  clicksContext?: ClicksContext
  autoScroll?: boolean
}>()

const emit = defineEmits<{
  (type: 'markerDblclick', e: MouseEvent, clicks: number): void
  (type: 'markerClick', e: MouseEvent, clicks: number): void
}>()

const withClicks = computed(() => props.clicksContext?.current != null && props.noteHtml?.includes('slidev-note-click-mark'))
const noteDisplay = ref<HTMLElement | null>(null)

const CLASS_FADE = 'slidev-note-fade'
const CLASS_MARKER = 'slidev-note-click-mark'

function highlightNote() {
  if (!noteDisplay.value || !withClicks.value)
    return

  const markers = Array.from(noteDisplay.value.querySelectorAll(`.${CLASS_MARKER}`)) as HTMLElement[]

  const current = +(props.clicksContext?.current ?? CLICKS_MAX)
  const disabled = current < 0 || current >= CLICKS_MAX

  const nodeToIgnores = new Set<Element>()
  function ignoreParent(node: Element) {
    if (!node || node === noteDisplay.value)
      return
    nodeToIgnores.add(node)
    if (node.parentElement)
      ignoreParent(node.parentElement)
  }

  const markersMap = new Map<number, HTMLElement>()

  // Convert all sibling text nodes to spans, so we attach classes to them
  for (const marker of markers) {
    const parent = marker.parentElement!
    const clicks = Number(marker.dataset!.clicks)
    markersMap.set(clicks, marker)
    // Ignore the parents of the marker, so the class only applies to the children
    ignoreParent(parent)
    Array.from(parent!.childNodes)
      .forEach((node) => {
        if (node.nodeType === 3) { // text node
          const span = document.createElement('span')
          span.textContent = node.textContent
          parent.insertBefore(span, node)
          node.remove()
        }
      })
  }
  const children = Array.from(noteDisplay.value.querySelectorAll('*'))

  let count = 0

  // Segmenting notes by clicks
  const segments = new Map<number, Element[]>()
  for (const child of children) {
    if (!segments.has(count))
      segments.set(count, [])
    segments.get(count)!.push(child)
    // Update count when reach marker
    if (child.classList.contains(CLASS_MARKER))
      count = Number((child as HTMLElement).dataset.clicks) || (count + 1)
  }

  // Apply
  for (const [count, els] of segments) {
    if (disabled) {
      els.forEach(el => el.classList.remove(CLASS_FADE))
    }
    else {
      els.forEach(el => el.classList.toggle(
        CLASS_FADE,
        nodeToIgnores.has(el)
          ? false
          : count !== current,
      ))
    }
  }

  for (const [clicks, marker] of markersMap) {
    marker.classList.remove(CLASS_FADE)
    marker.classList.toggle(`${CLASS_MARKER}-past`, disabled ? false : clicks < current)
    marker.classList.toggle(`${CLASS_MARKER}-active`, disabled ? false : clicks === current)
    marker.classList.toggle(`${CLASS_MARKER}-next`, disabled ? false : clicks === current + 1)
    marker.classList.toggle(`${CLASS_MARKER}-future`, disabled ? false : clicks > current + 1)
    marker.ondblclick = (e) => {
      emit('markerDblclick', e, clicks)
      if (e.defaultPrevented)
        return
      props.clicksContext!.current = clicks
      e.stopPropagation()
      e.stopImmediatePropagation()
    }
    marker.onclick = (e) => {
      emit('markerClick', e, clicks)
    }

    if (props.autoScroll && clicks === current)
      marker.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

watch(
  () => [props.noteHtml, props.clicksContext?.current],
  () => {
    nextTick(() => {
      highlightNote()
    })
  },
  { immediate: true },
)

onMounted(() => {
  highlightNote()
})
</script>

<template>
  <div
    v-if="noteHtml"
    ref="noteDisplay"
    class="prose overflow-auto outline-none slidev-note"
    :class="[props.class, withClicks ? 'slidev-note-with-clicks' : '']"
    v-html="noteHtml"
  />
  <div
    v-else-if="note"
    class="prose overflow-auto outline-none slidev-note"
    :class="props.class"
  >
    <p v-text="note" />
  </div>
  <div
    v-else
    class="prose overflow-auto outline-none opacity-50 italic select-none slidev-note"
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

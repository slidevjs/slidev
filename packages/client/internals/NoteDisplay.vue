<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { CLICKS_MAX } from '../constants'

const props = defineProps<{
  class?: string
  noteHtml?: string
  note?: string
  placeholder?: string
  clicks?: number | string
}>()

defineEmits(['click'])

const withClicks = computed(() => props.clicks != null && props.noteHtml?.includes('slidev-note-click-mark'))
const noteDisplay = ref<HTMLElement | null>(null)

function highlightNote() {
  if (!noteDisplay.value || !withClicks.value || props.clicks == null)
    return

  const disabled = +props.clicks < 0 || +props.clicks >= CLICKS_MAX
  if (disabled) {
    Array.from(noteDisplay.value.querySelectorAll('*'))
      .forEach(el => el.classList.remove('slidev-note-fade'))
    return
  }

  const nodeToIgnores = new Set<Element>()
  function ignoreParent(node: Element) {
    if (!node || node === noteDisplay.value)
      return
    nodeToIgnores.add(node)
    if (node.parentElement)
      ignoreParent(node.parentElement)
  }

  const markers = Array.from(noteDisplay.value.querySelectorAll('.slidev-note-click-mark'))
  // Convert all sibling text nodes to spans, so we attach classes to them
  for (const marker of markers) {
    const parent = marker.parentElement!
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

  const groups = new Map<number, Element[]>()

  for (const child of children) {
    if (!groups.has(count))
      groups.set(count, [])

    groups.get(count)!.push(child)
    if (child.classList.contains('slidev-note-click-mark'))
      count = Number((child as HTMLElement).dataset.clicks) || (count + 1)
  }

  for (const [count, els] of groups) {
    els.forEach(el => el.classList.toggle(
      'slidev-note-fade',
      nodeToIgnores.has(el)
        ? false
        : +count !== +props.clicks!,
    ))
  }
}

watch(
  () => [props.noteHtml, props.clicks],
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
    @click="$emit('click')"
    v-html="noteHtml"
  />
  <div
    v-else-if="note"
    class="prose overflow-auto outline-none"
    :class="props.class"
    @click="$emit('click')"
  >
    <p v-text="note" />
  </div>
  <div
    v-else
    class="prose overflow-auto outline-none opacity-50 italic select-none"
    :class="props.class"
    @click="$emit('click')"
  >
    <p v-text="props.placeholder || 'No notes.'" />
  </div>
</template>

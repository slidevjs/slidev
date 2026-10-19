<script setup lang="ts">
import type { ClicksContext } from '@slidev/types'
import { computed, nextTick, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { CLICKS_MAX } from '../constants'
import { useSlideInfo } from '../composables/useSlideInfo'

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

// --- tabs -------------------------------------------------------------------
const activeTab = ref<'rendered' | 'source'>('rendered')

// --- shiki highlighting for the source tab --------------------------------
const shikiHtml = shallowRef<string | null>(null)
import('../setup/shiki').then(async (m) => {
  try {
    const { getEagerHighlighter, defaultHighlightOptions } = await m.default()
    const highlighter = await getEagerHighlighter()
    const render = (code: string) => highlighter.codeToHtml(code, {
      ...defaultHighlightOptions,
      lang: 'markdown',
    })
    shikiHtml.value = render(props.note ?? '')
    // re-render when note changes
    watch(() => props.note, (v) => {
      if (shikiHtml.value !== null)
        shikiHtml.value = render(v ?? '')
    })
  }
  catch {
    shikiHtml.value = null
  }
}).catch(() => {
  shikiHtml.value = null
})

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

      let siblingEl = sibling as HTMLElement
      if (sibling.nodeType === 3) {
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
  () => [props.noteHtml, props.highlight, activeTab.value],
  () => {
    nextTick(() => {
      if (activeTab.value === 'rendered')
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
  <div class="slidev-note-tabs">
    <div role="tablist" class="slidev-note-tabs__bar" aria-label="Notes view">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'rendered'"
        class="slidev-note-tabs__tab"
        :class="{ 'slidev-note-tabs__tab--active': activeTab === 'rendered' }"
        @click="activeTab = 'rendered'"
      >
        Rendered
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'source'"
        class="slidev-note-tabs__tab"
        :class="{ 'slidev-note-tabs__tab--active': activeTab === 'source' }"
        @click="activeTab = 'source'"
      >
        Source
      </button>
    </div>

    <!-- Rendered tab -->
    <div
      v-if="activeTab === 'rendered'"
      role="tabpanel"
      class="slidev-note slidev-note--rendered"
      :class="[props.class, withClicks ? 'slidev-note-with-clicks' : '']"
    >
      <div
        v-if="noteHtml"
        ref="noteDisplay"
        class="prose dark:prose-invert overflow-auto outline-none"
        v-html="noteHtml"
      />
      <div
        v-else-if="note"
        class="prose dark:prose-invert overflow-auto outline-none"
      >
        <p v-text="note" />
      </div>
      <div
        v-else
        class="prose dark:prose-invert overflow-auto outline-none opacity-50 italic select-none"
      >
        <p v-text="props.placeholder || 'No notes.'" />
      </div>
    </div>

    <!-- Source tab -->
    <div
      v-else
      role="tabpanel"
      class="slidev-note slidev-note--source"
      :class="props.class"
    >
      <div
        v-if="note"
        class="slidev-note__source"
        v-html="shikiHtml ?? escapeHtml(note)"
      />
      <div
        v-else
        class="prose dark:prose-invert overflow-auto outline-none opacity-50 italic select-none"
      >
        <p v-text="props.placeholder || 'No notes.'" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<style>
.slidev-note-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.slidev-note-tabs__bar {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0.25rem 0.5rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
}

.slidev-note-tabs__tab {
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: inherit;
  opacity: 0.6;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.slidev-note-tabs__tab:hover {
  opacity: 0.9;
}

.slidev-note-tabs__tab--active {
  opacity: 1;
  background: rgba(128, 128, 128, 0.15);
  border-color: rgba(128, 128, 128, 0.3);
}

.slidev-note-tabs__tab:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.slidev-note {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.slidev-note :first-child {
  margin-top: 0;
}

/* Rendered tab: code blocks wrap instead of horizontal scroll */
.slidev-note pre {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: hidden;
}

/* Light mode contrast fix */
.slidev-note pre {
  background-color: #f3f4f6;
  color: #1f2937;
}

/* Dark mode contrast fix */
@media (prefers-color-scheme: dark) {
  .slidev-note pre {
    background-color: #1f2937;
    color: #e5e7eb;
  }
}

.dark .slidev-note pre {
  background-color: #1f2937;
  color: #e5e7eb;
}

/* Shiki blocks in notes: dark mode override */
.dark .slidev-note .shiki {
  background-color: var(--shiki-dark-bg, #121212) !important;
  color: var(--shiki-dark, #dbd7caee) !important;
}

.dark .slidev-note .shiki span {
  color: var(--shiki-dark) !important;
}

.slidev-note__loading {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.slidev-note__skeleton {
  display: block;
  height: 0.85rem;
  border-radius: 0.25rem;
  background: rgba(128, 128, 128, 0.25);
  animation: slidev-note-skeleton 1.2s ease-in-out infinite;
}

.slidev-note__skeleton--short {
  width: 60%;
}

@keyframes slidev-note-skeleton {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}

.slidev-note__source :deep(pre.shiki) {
  background-color: transparent;
  margin: 0;
  font-size: 1em;
  white-space: pre-wrap;
  word-break: break-word;
}

.slidev-note__source :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-feature-settings: normal;
  font-variation-settings: normal;
  text-wrap: wrap;
}
</style>
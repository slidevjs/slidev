<!--
Line highlighting for code blocks.
(auto transformed, you don't need to use this component directly)

Usage:

```ts {1,3-5|2,4}
const your_code = 'here'
```

Learn more: https://sli.dev/guide/syntax.html#line-highlighting
-->

<script setup lang="ts">
import { range, remove } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/core'
import { useClipboard } from '@vueuse/core'
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { configs } from '../env'
import { CLASS_VCLICK_TARGET, injectionClicks, injectionClicksDisabled, injectionClicksElements } from '../constants'

const props = defineProps({
  ranges: {
    default: () => [],
  },
  startLine: {
    type: Number,
    default: 1,
  },
  lines: {
    type: Boolean,
    default: configs.lineNumbers,
  },
  at: {
    type: Number,
    default: undefined,
  },
  maxHeight: {
    type: String,
    default: undefined,
  },
})

const clicks = inject(injectionClicks)
const elements = inject(injectionClicksElements)
const disabled = inject(injectionClicksDisabled)

function makeId(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  return result.join('')
}

const el = ref<HTMLDivElement>()
const vm = getCurrentInstance()

onMounted(() => {
  const prev = props.at == null ? elements?.value.length : props.at
  const index = computed(() => {
    if (disabled?.value)
      return props.ranges.length - 1
    return Math.min(Math.max(0, (clicks?.value || 0) - (prev || 0)), props.ranges.length - 1)
  })
  const rangeStr = computed(() => props.ranges[index.value] || '')
  if (props.ranges.length >= 2 && !disabled?.value) {
    const id = makeId()
    const ids = range(props.ranges.length - 1).map(i => id + i)
    if (elements?.value) {
      elements.value.push(...ids)
      onUnmounted(() => ids.forEach(i => remove(elements.value, i)), vm)
    }
  }

  watchEffect(() => {
    if (!el.value)
      return
    const isDuoTone = el.value.querySelector('.shiki-dark')
    const targets = isDuoTone ? Array.from(el.value.querySelectorAll('.shiki')) : [el.value]
    const startLine = props.startLine
    for (const target of targets) {
      const lines = Array.from(target.querySelectorAll('.line'))
      const highlights: number[] = parseRangeString(lines.length + startLine - 1, rangeStr.value)
      lines.forEach((line, idx) => {
        const highlighted = highlights.includes(idx + startLine)
        line.classList.toggle(CLASS_VCLICK_TARGET, true)
        line.classList.toggle('highlighted', highlighted)
        line.classList.toggle('dishonored', !highlighted)
      })
      if (props.maxHeight) {
        const highlightedEls = Array.from(target.querySelectorAll('.line.highlighted')) as HTMLElement[]
        const height = highlightedEls.reduce((acc, el) => el.offsetHeight + acc, 0)
        if (height > el.value.offsetHeight) {
          highlightedEls[0].scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        else if (highlightedEls.length > 0) {
          const middleEl = highlightedEls[Math.round((highlightedEls.length - 1) / 2)]
          middleEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  })
})

const { copied, copy } = useClipboard()

function copyCode() {
  const code = el.value?.querySelector('.slidev-code')?.textContent
  if (code)
    copy(code)
}
</script>

<template>
  <div
    ref="el" class="slidev-code-wrapper relative group"
    :class="{
      'slidev-code-line-numbers': props.lines,
    }"
    :style="{
      'max-height': props.maxHeight,
      'overflow-y': props.maxHeight ? 'scroll' : undefined,
      '--start': props.startLine,
    }"
  >
    <slot />
    <button
      v-if="configs.codeCopy"
      class="slidev-code-copy absolute top-0 right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100"
      :title="copied ? 'Copied' : 'Copy'" @click="copyCode()"
    >
      <ph-check-circle v-if="copied" class="p-2 w-8 h-8" />
      <ph-clipboard v-else class="p-2 w-8 h-8" />
    </button>
  </div>
</template>

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
import { parseRangeString } from '@slidev/parser/core'
import { useClipboard } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { configs } from '../env'
import { makeId } from '../logic/utils'
import { CLASS_VCLICK_HIDDEN, CLASS_VCLICK_TARGET } from '../constants'
import { useSlideContext } from '../context'

const props = defineProps({
  ranges: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  finally: {
    type: [String, Number],
    default: 'last',
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
    type: [String, Number],
    default: '+1',
  },
  maxHeight: {
    type: String,
    default: undefined,
  },
})

const { $clicksContext: clicks } = useSlideContext()
const el = ref<HTMLDivElement>()
const id = makeId()

onUnmounted(() => {
  clicks!.unregister(id)
})

watchEffect(() => {
  el.value?.classList.toggle('slidev-code-line-numbers', props.lines)
})

onMounted(() => {
  if (!clicks || clicks.disabled || !props.ranges?.length)
    return

  const { start, end, delta } = clicks.resolve(props.at, props.ranges.length - 1)
  clicks.register(id, { max: end, delta })

  const index = computed(() => {
    if (clicks.disabled)
      return props.ranges.length - 1
    return Math.max(0, clicks.current - start + 1)
  })

  const finallyRange = computed(() => {
    return props.finally === 'last' ? props.ranges.at(-1) : props.finally.toString()
  })

  watchEffect(() => {
    if (!el.value)
      return

    let rangeStr = props.ranges[index.value] ?? finallyRange.value
    const hide = rangeStr === 'hide'
    el.value.classList.toggle(CLASS_VCLICK_HIDDEN, hide)
    if (hide)
      rangeStr = props.ranges[index.value + 1] ?? finallyRange.value

    const isDuoTone = el.value.querySelector('.shiki-dark')
    const targets = isDuoTone ? Array.from(el.value.querySelectorAll('.shiki')) : [el.value]
    const startLine = props.startLine
    for (const target of targets) {
      const lines = Array.from(target.querySelectorAll('code > .line'))
      const highlights: number[] = parseRangeString(lines.length + startLine - 1, rangeStr)
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
    ref="el"
    class="slidev-code-wrapper relative group"
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

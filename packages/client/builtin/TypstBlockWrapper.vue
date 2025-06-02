<!--
Line highlighting for Typst blocks
(auto transformed, you don't need to use this component directly)

Usage:
$$ {1|3|all}
\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}
$$
-->

<script setup lang="ts">
import type { PropType } from 'vue'
import { parseRangeString } from '@slidev/parser/utils'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { CLASS_VCLICK_HIDDEN, CLASS_VCLICK_TARGET, CLICKS_MAX } from '../constants'
import { useSlideContext } from '../context'
import { makeId } from '../logic/utils'

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
  at: {
    type: [String, Number],
    default: '+1',
  },
})

const { $clicksContext: clicks } = useSlideContext()
const el = ref<HTMLDivElement>()
const id = makeId()

onUnmounted(() => {
  clicks!.unregister(id)
})

onMounted(() => {
  if (!clicks || !props.ranges?.length)
    return

  const clicksInfo = clicks.calculateSince(props.at, props.ranges.length - 1)
  clicks.register(id, clicksInfo)

  const index = computed(() => clicksInfo ? Math.max(0, clicks.current - clicksInfo.start + 1) : CLICKS_MAX)

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

    // For Typst, we'll need to implement line highlighting based on the rendered output
    // This will depend on how Typst.ts renders formulas
    // For now, we'll just add a data attribute with the range
    el.value.setAttribute('data-typst-highlight', rangeStr)
  })
})
</script>

<template>
  <div ref="el" class="slidev-typst-wrapper">
    <slot />
  </div>
</template>
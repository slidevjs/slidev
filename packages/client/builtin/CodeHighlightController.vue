<script setup lang="ts">
import { range, remove } from '@antfu/utils'
import { parseRangeString } from '@slidev/parser/core'
import { computed, defineProps, inject, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { injectionClicks, injectionClicksElements, injectionClicksDisabled } from '../modules/directives'

const props = defineProps({
  ranges: {
    default: () => [],
  },
})

const clicks = inject(injectionClicks)!
const elements = inject(injectionClicksElements)!
const disabled = inject(injectionClicksDisabled)!

function makeid(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random()
 * charactersLength)))
  }
  return result.join('')
}

const prev = elements.value.length
const index = computed(() => {
  if (disabled.value)
    return props.ranges.length - 1
  return Math.min(Math.max(0, clicks.value - prev), props.ranges.length - 1)
})
const rangeStr = computed(() => props.ranges[index.value] || '')
if (props.ranges.length >= 2 && !disabled.value) {
  const id = makeid()
  const ids = range(props.ranges.length - 1).map(i => id + i)
  elements.value.push(...ids)
  onUnmounted(() => {
    ids.forEach(i => remove(elements.value, i))
  })
}

const el = ref<HTMLDivElement>()

onMounted(() => {
  watchEffect(() => {
    if (!el.value)
      return
    const duoTone = el.value.querySelector('.shiki-dark')
    const targets = duoTone ? Array.from(el.value.querySelectorAll('.shiki')) : [el.value]
    for (const target of targets) {
      const lines = Array.from(target.querySelectorAll('.line'))
      const hightlights: number[] = parseRangeString(lines.length, rangeStr.value)
      // console.log(hightlights, rangeStr.value)
      lines.forEach((line, idx) => {
        line.classList.toggle('opacity-30', !hightlights.includes(idx))
      })
    }
  })
})
</script>

<template>
  <div ref="el">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  getHashColorFromString,
  getHsla,
} from '../logic/color'

const props = withDefaults(
  defineProps<{
    text?: string
    color?: boolean | number
    as?: string
    size?: string
  }>(),
  {
    color: true,
  },
)

const style = computed(() => {
  if (!props.text || props.color === false)
    return {}
  return {
    color: typeof props.color === 'number'
      ? getHsla(props.color)
      : getHashColorFromString(props.text),
    background: typeof props.color === 'number'
      ? getHsla(props.color, 0.1)
      : getHashColorFromString(props.text, 0.1),
  }
})

const sizeClasses = computed(() => {
  switch (props.size || 'sm') {
    case 'sm':
      return 'px-1.5 text-11px leading-1.6em'
  }
  return ''
})
</script>

<template>
  <component :is="as || 'span'" ws-nowrap rounded :class="sizeClasses" :style>
    <slot>
      <span v-text="props.text" />
    </slot>
  </component>
</template>

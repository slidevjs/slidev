<script setup lang="ts">
import type { Slots } from 'vue'
import { h } from 'vue'
import { slideHeight, slideWidth } from '../env'

function vStyle<Props>(props: Props, { slots }: { slots: Slots }) {
  if (slots.default)
    return h('style', slots.default())
}
</script>

<template>
  <vStyle>
    @page { size: {{ slideWidth }}px {{ slideHeight }}px; margin: 0px; }
  </vStyle>
</template>

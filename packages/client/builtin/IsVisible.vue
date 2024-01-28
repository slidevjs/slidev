<!--
Shows it's children only, if the component is visible in the viewport. This is useful for iframes.

Usage:

<IsVisible>
  Only rendered when in the viewport
</IsVisible>

<IsVisible>
  <Youtube id="lkjansdlkjasnd" />
</IsVisible>

-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const slotWrapper = ref<HTMLElement>()
const isVisible = ref(false)
const observer = ref<IntersectionObserver>()

function show() {
  isVisible.value = true
}

function hide() {
  isVisible.value = false
}

onMounted(() => {
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting)
        show()
      else
        hide()
    })
  }, { threshold: 0.1 })

  if (slotWrapper.value)
    observer.value.observe(slotWrapper.value)
})

onBeforeUnmount(() => {
  if (observer.value)
    observer.value.disconnect()
})
</script>

<template>
  <div ref="slotWrapper">
    <slot v-if="isVisible" />
  </div>
</template>

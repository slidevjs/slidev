<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const slotWrapper = ref(null)
const isVisible = ref(false)
const observer = ref(null)

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

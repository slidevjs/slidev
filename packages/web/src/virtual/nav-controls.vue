<script setup lang="ts">
import { useNav } from '@slidev/client'
import IconButton from '@slidev/client/internals/IconButton.vue'
import { slidesSource } from '../slides'

const nav = useNav()

function add() {
  slidesSource.push({
    frontmatter: {},
    content: `# ${slidesSource.length + 1}`,
    note: '',
  })
  nav.goLast()
}

function remove() {
  if (nav.currentSlideNo.value === nav.total.value) {
    nav.prevSlide()
  }
  slidesSource.splice(nav.currentSlideNo.value - 1, 1)
}
</script>

<template>
  <IconButton class="slidev-icon" title="Add Slide" @click="add">
    <carbon:add-large />
  </IconButton>
  <IconButton class="slidev-icon" title="Remove Slide" :disabled="nav.total.value === 1" @click="remove">
    <carbon:trash-can />
  </IconButton>
</template>

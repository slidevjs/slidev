<script setup lang="ts">
defineProps<{
  links: string[]
}>()
</script>

<template>
  <blockquote>
    <div class="op-90 mb--1">
      See also:
    </div>
    <LinkCard v-for="link in links" :key="link" :link="link" />
  </blockquote>
</template>

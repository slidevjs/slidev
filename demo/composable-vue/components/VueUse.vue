<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <div class="px-2 -mx-2 mt-4 py-2">
    <img src="https://vueuse.org/favicon.svg" class="h-1em -mb-0.5 mr-2 inline-block align-baseline" alt="">
    <span class="opacity-50">Available in VueUse: </span><a class="font-mono opacity-75 hover:opacity-100" :href="`https://vueuse.org/${name}`">{{ name }}</a>
  </div>
</template>

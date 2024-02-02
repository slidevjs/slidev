<script setup lang="ts">
defineProps<{ type: 'node' | 'client' }>()
</script>

<template>
  <details class="p4 mt-4 rounded-lg bg-gray-400 bg-opacity-10">
    <summary class="outline-none !m0 select-none">
      Environment:
      <span class="capitalize font-bold" :class="type === 'node' ? 'text-orange-400' : 'text-green-400'">{{ type }}</span>
    </summary>

    <div class="pt2 opacity-75">
      <span v-if="type === 'node'">
        This setup function will only run on Node.js environment, you can have access to Node's API.
      </span>
      <span v-else>
        This setup function will only run on client side. Make sure the browser compatibility when importing packages.
      </span>
    </div>
  </details>
</template>

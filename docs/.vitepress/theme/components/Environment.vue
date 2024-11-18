<script setup lang="ts">
defineProps<{ type: 'node' | 'client' | 'both' }>()
</script>

<template>
  <details class="p4 mt-4 rounded-lg bg-gray-400 bg-opacity-10">
    <summary class="outline-none !m0 select-none">
      Environment:
      <span class="capitalize font-bold" :class="type === 'node' ? 'text-orange-400' : 'text-green-400'">{{ type }}</span>
    </summary>

    <div class="pt2 opacity-75">
      <span v-if="type === 'both'">
        This setup function will run on <b>both</b> Node.js and client side. Avoid using Node.js or DOM API to prevent runtime errors.
      </span>
      <span v-else-if="type === 'node'">
        This setup function will only run on Node.js environment, you can have access to Node's API.
      </span>
      <span v-else-if="type === 'client'">
        This setup function will only run on client side. Make sure the browser compatibility when importing packages.
      </span>
    </div>
  </details>
</template>

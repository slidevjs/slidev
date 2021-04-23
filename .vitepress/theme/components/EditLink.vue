<template>
  <div class="edit-link">
    <a v-if="url" class="link" :href="url" target="_blank" rel="noopener noreferrer">
      <carbon-edit style="opacity:0.6" /> {{ text }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { useEditLink } from '../composables/editLink'
import OutboundLink from './icons/OutboundLink.vue'

const { url, text } = useEditLink()
</script>

<style scoped>
.link {
  display: inline-block;
  font-size: 1rem;
  color: var(--c-text-light);
}

.link:hover {
  text-decoration: none;
  color: var(--c-brand);
}

.edit-link {
  opacity: 0.8;
  font-weight: 400;
}

.edit-link:hover {
  opacity: 1;
}
</style>

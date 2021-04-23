<template>
  <div v-if="hasLinks" class="next-and-prev-link">
    <div class="container">
      <div class="prev">
        <a v-if="prev" class="link" :href="$withBase(prev.link)">
          <ArrowLeft class="icon icon-prev" />
          <span class="text">{{ prev.text }}</span>
        </a>
      </div>
      <div class="next">
        <a v-if="next" class="link" :href="$withBase(next.link)">
          <span class="text">{{ next.text }}</span>
          <ArrowRight class="icon icon-next" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNextAndPrevLinks } from '../composables/nextAndPrevLinks'
import ArrowLeft from './icons/ArrowLeft.vue'
import ArrowRight from './icons/ArrowRight.vue'

const { hasLinks, prev, next } = useNextAndPrevLinks()
</script>

<style scoped>
.next-and-prev-link {
  padding-top: 1rem;
}

.container {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--c-divider);
  padding-top: 1rem;
}

.prev,
.next {
  display: flex;
  flex-shrink: 0;
  width: 50%;
}

.prev {
  justify-content: flex-start;
  padding-right: 12px;
}

.next {
  justify-content: flex-end;
  padding-left: 12px;
}

.link {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  font-size: 1rem;
  font-weight: 500;
}

.text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon {
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  fill: var(--c-text);
  transform: translateY(1px);
}

.icon-prev {
  margin-right: 8px;
}
.icon-next {
  margin-left: 8px;
}
</style>

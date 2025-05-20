<script setup lang="ts">
import { onMounted, provide, ref, useTemplateRef } from 'vue'
import TitleIcon from '../internals/TitleIcon.vue'

const codeGroupBlocksRef = useTemplateRef('codeGroupBlocksRef')
const activeTitle = ref('')

provide('activeTitle', activeTitle)
const tabs = ref<string[]>([])

onMounted(() => {
  const codeGroupBlocks = codeGroupBlocksRef.value
  let isActiveSet = false

  codeGroupBlocks?.querySelectorAll('.slidev-code-wrapper')?.forEach((block) => {
    const title = block.getAttribute('data-title') || ''
    if (title) {
      if (!isActiveSet) {
        activeTitle.value = title
        isActiveSet = true
      }
      tabs.value.push(title)
    }
  })
})
</script>

<template>
  <div class="slidev-code-group">
    <div class="slidev-code-group-tabs">
      <div v-for="tab in tabs" :key="tab" class="flex items-center">
        <div
          class="slidev-code-tab"
          :style="{
            borderColor: activeTitle === tab ? 'var(--slidev-theme-primary)' : 'transparent',
            color: activeTitle === tab ? 'var(--slidev-code-tab-active-text-color)' : 'var(--slidev-code-tab-text-color)',
          }"
          @click="activeTitle = tab"
        >
          <TitleIcon :title="tab" />

          <div>
            {{ tab }}
          </div>
        </div>
      </div>
    </div>
    <div ref="codeGroupBlocksRef" class="slidev-code-group-blocks">
      <slot />
    </div>
  </div>
</template>

<style>
.slidev-code-group-tabs {
  background: var(--slidev-code-background);
  padding-left: var(--slidev-code-padding);
  padding-right: var(--slidev-code-padding);
  border-radius: var(--slidev-code-radius) var(--slidev-code-radius) 0 0;
  box-shadow: inset 0 -1px var(--slidev-code-tab-divider);
  display: flex;
  gap: 10px;
}

.slidev-code-tab {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s;
  line-height: 38px;
  padding-left: 6px;
  padding-right: 6px;
  border-bottom: 2px solid transparent;
  color: var(--slidev-code-tab-text-color);
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.slidev-code-tab:hover {
  color: var(--slidev-code-tab-active-text-color) !important;
}

.slidev-code-group-blocks .slidev-code-wrapper {
  margin: 0 !important;
}

.slidev-code-group-blocks .slidev-code {
  border-radius: 0 0 var(--slidev-code-radius) var(--slidev-code-radius) !important;
}

.slidev-code-group-blocks .slidev-code-wrapper.active {
  display: block;
}

.slidev-code-group-blocks .slidev-code-wrapper {
  display: none;
}
</style>

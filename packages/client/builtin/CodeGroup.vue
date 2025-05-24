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
            {{ tab.replace(/~([^~]+)~/g, '').trim() }}
          </div>
        </div>
      </div>
    </div>
    <div ref="codeGroupBlocksRef" class="slidev-code-group-blocks">
      <slot />
    </div>
  </div>
</template>

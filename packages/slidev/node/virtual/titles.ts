import type { VirtualModuleTemplate } from './types'

export const templateTitleRendererMd: VirtualModuleTemplate = {
  id: '/@slidev/title-renderer.md',
  async getContent({ data }) {
    const lines = data.slides
      .map(({ title }, i) => `<template ${i === 0 ? 'v-if' : 'v-else-if'}="+no === ${i + 1}">\n\n${title}\n\n</template>`)

    lines.push(`<script setup lang="ts">defineProps<{ no: number | string }>()</script>`)

    return lines.join('\n')
  },
}

export const templateTitleRenderer: VirtualModuleTemplate = {
  id: '/@slidev/title-renderer',
  async getContent() {
    return 'export { default } from "/@slidev/title-renderer.md"'
  },
}

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useCodeMirror } from '../composables/useCodeMirror'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLElement | null>(null)

useCodeMirror(
  editorContainer,
  toRef(() => props.modelValue),
  value => emit('update:modelValue', value),
)
</script>

<template>
  <div ref="editorContainer" class="cm-editor-wrapper" />
</template>

<style scoped>
.cm-editor-wrapper {
  height: 100%;
  overflow: hidden;
  background: #1e1e1e;
}

.cm-editor-wrapper :deep(.cm-editor) {
  height: 100%;
}
</style>

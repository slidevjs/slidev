<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import { configs } from '../env'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    default: false,
  },
})

const emit = defineEmits<{ (name: 'modelValue', v: boolean): void }>()
const value = useVModel(props, 'modelValue', emit)
const hasInfo = computed(() => typeof configs.info === 'string')
</script>

<template>
  <Modal v-model="value" class="px-6 py-4">
    <div class="slidev-info-dialog slidev-layout flex flex-col gap-4 text-base">
      <div
        v-if="hasInfo"
        class="mb-4"
        v-html="configs.info"
      />
      <a
        href="https://github.com/slidevjs/slidev"
        target="_blank"
        class="!opacity-100 !border-none !text-current"
      >
        <div class="flex gap-1 children:my-auto">
          <div class="opacity-50 text-sm mr-2">Powered by</div>
          <img
            class="w-5 h-5"
            src="../assets/logo.png"
            alt="Slidev"
          >
          <div style="color: #2082A6">
            <b>Sli</b>dev
          </div>
        </div>
      </a>
    </div>
  </Modal>
</template>

<style lang="postcss">
.slidev-info-dialog {
  @apply !p-4 max-w-150;
}
</style>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { defineEmit, defineProps } from 'vue'
import Modal from './Modal.vue'

const emit = defineEmit()
const props = defineProps({
  modelValue: {
    default: false,
  },
})

const value = useVModel(props, 'modelValue', emit)
</script>

<template>
  <Modal v-model="value" class="px-10 py-6">
    <div class="flex flex-col gap-2 children:mx-auto">
      <div class="opacity-50 text-sm mb-4">
        Slides powered by
      </div>
      <img class="w-25 h-25" src="https://raw.githubusercontent.com/slidevjs/slidev/main/assets/logo.png" alt="Slidev" />
      <div class="text-3xl" style="color: #2082A6">
        <b>Sli</b>dev
      </div>
      <div class="opacity-50 -mt-2 text-sm">
        Presentation Slides for Developers
      </div>
      <a
        href="https://github.com/slidevjs/slidev"
        target="_blank"
        class="opacity-75 mt-4"
        hover="opacity-100 text-[#2082A6]"
      >Learn More</a>
    </div>
  </Modal>
</template>

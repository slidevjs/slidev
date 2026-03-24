<script setup lang="ts">
import type { SelectionItem } from './types'
import { computed, ref } from 'vue'
import { recorder } from '../logic/recording'
import { virtualBgBlurRadius, virtualBgColor, virtualBgImage, virtualBgMode } from '../state'
import FormSlider from './FormSlider.vue'
import SelectList from './SelectList.vue'

const { vbIsLoading } = recorder

const modeItems = computed<SelectionItem<string>[]>(() => [
  { value: 'none', display: 'None' },
  { value: 'blur', display: 'Blur Background' },
  { value: 'color', display: 'Solid Color' },
  { value: 'image', display: 'Image' },
])

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')

function onImageUrlInput(event: Event) {
  const target = event.target as HTMLInputElement
  virtualBgImage.value = target.value
  fileName.value = ''
}

function onColorInput(event: Event) {
  const target = event.target as HTMLInputElement
  virtualBgColor.value = target.value
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  fileName.value = file.name

  // Convert local file to data URL so <img> and Canvas can use it
  const reader = new FileReader()
  reader.onload = (e) => {
    virtualBgImage.value = (e.target?.result as string) || ''
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div text-sm flex="~ col gap-2">
    <SelectList
      v-model="virtualBgMode"
      title="Virtual Background"
      :items="modeItems"
    />

    <div v-if="vbIsLoading" class="px-3 py-1 text-xs opacity-50 flex items-center gap-1">
      <div class="i-svg-spinners:180-ring-with-bg" />
      Loading model...
    </div>

    <template v-if="virtualBgMode === 'blur'">
      <div class="px-3 py-1">
        <div class="text-xs uppercase opacity-50 tracking-widest py-1 select-none">
          Blur Intensity
        </div>
        <div class="flex items-center gap-2">
          <FormSlider
            v-model="virtualBgBlurRadius"
            :min="1"
            :max="30"
            :step="1"
            :default="10"
            unit="px"
          />
        </div>
      </div>
    </template>

    <template v-if="virtualBgMode === 'color'">
      <div class="px-3 py-1">
        <div class="text-xs uppercase opacity-50 tracking-widest py-1 select-none">
          Background Color
        </div>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="virtualBgColor"
            class="w-8 h-8 rounded cursor-pointer border border-main"
            @input="onColorInput"
          >
          <span class="text-xs opacity-50 font-mono">{{ virtualBgColor }}</span>
        </div>
      </div>
    </template>

    <template v-if="virtualBgMode === 'image'">
      <div class="px-3 py-1 flex flex-col gap-2">
        <div class="text-xs uppercase opacity-50 tracking-widest py-1 select-none">
          Background Image
        </div>

        <!-- Local file upload -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        >
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs rounded border border-main bg-transparent text-current hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer"
          @click="triggerFileSelect"
        >
          <div class="i-carbon:upload text-xs" />
          {{ fileName || 'Choose local file...' }}
        </button>

        <!-- URL input -->
        <div class="text-xs opacity-40 select-none">
          or enter URL / path:
        </div>
        <input
          type="text"
          :value="virtualBgImage && !virtualBgImage.startsWith('data:') ? virtualBgImage : ''"
          placeholder="/path/to/bg.jpg or https://..."
          class="bg-transparent text-current border border-main rounded px-2 py-1 w-full text-xs"
          @input="onImageUrlInput"
        >
      </div>
    </template>
  </div>
</template>

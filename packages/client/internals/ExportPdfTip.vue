<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { skipExportPdfTip } from '../state'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'print'])
const value = useVModel(props, 'modelValue', emit)

function print() {
  value.value = false
  emit('print')
}
</script>

<template>
  <Modal v-model="value" class="px-6 py-4 flex flex-col gap-2">
    <div class="flex gap-2 text-xl">
      <div class="i-carbon:information my-auto" /> Tips
    </div>
    <div>
      Slidev will open your browser's built-in print dialog to export the slides as PDF. <br>
      In the print dialog, please:
      <ul class="list-disc my-4 pl-4">
        <li>
          Choose "Save as PDF" as the Destination.
          <span class="op-70 text-xs"> (Not "Microsoft Print to PDF") </span>
        </li>
        <li> Choose "Default" as the Margin. </li>
        <li> Toggle on "Print backgrounds". </li>
      </ul>
      <div class="mb-2 op-70 text-sm">
        If you're encountering problems, please try
        <a href="https://sli.dev/builtin/cli#export"> the CLI </a>
        or
        <a href="https://github.com/slidevjs/slidev/issues/new"> open an issue</a>.
      </div>
      <div class="form-check op-70">
        <input
          v-model="skipExportPdfTip"
          name="record-camera"
          type="checkbox"
        >
        <label for="record-camera" @click="skipExportPdfTip = !skipExportPdfTip">Don't show this dialog next time.</label>
      </div>
    </div>
    <div class="flex my-1">
      <button class="cancel" @click="value = false">
        Cancel
      </button>
      <div class="flex-auto" />
      <button @click="print">
        Start
      </button>
    </div>
  </Modal>
</template>

<style scoped>
button {
  @apply bg-blue-400 text-white px-4 py-1 rounded border-b-2 border-blue-600;
  @apply hover:(bg-blue-500 border-blue-700);
}

button.cancel {
  @apply bg-gray-400 bg-opacity-50 text-white px-4 py-1 rounded border-b-2 border-main;
  @apply hover:(bg-opacity-75 border-opacity-75);
}

a {
  @apply border-current border-b border-dashed hover:text-primary hover:border-solid;
}

.form-check {
  @apply leading-5;

  * {
    @apply my-auto align-middle;
  }

  label {
    @apply ml-1 text-sm select-none;
  }
}
</style>

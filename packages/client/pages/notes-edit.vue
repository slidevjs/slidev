<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { debouncedWatch } from '@vueuse/core'
import { ref } from 'vue'
import { useNav } from '../composables/useNav'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import { slidesTitle } from '../env'
import IconButton from '../internals/IconButton.vue'
import Modal from '../internals/Modal.vue'

useHead({ title: `Notes Edit - ${slidesTitle}` })

const { slides } = useNav()

const showHelp = ref(false)
const note = ref(serializeNotes(slides.value))

function serializeNotes(slides: SlideRoute[]) {
  const lines: string[] = []

  for (const slide of slides) {
    if (!slide.meta.slide.note?.trim())
      continue
    lines.push(`--- #${slide.no}`)
    lines.push('')
    lines.push(slide.meta.slide.note)
    lines.push('')
  }

  return lines.join('\n')
}

function deserializeNotes(notes: string, slides: SlideRoute[]) {
  const lines = notes.split(/^(---\s*#\d+\s*)$/gm)

  lines.forEach((line, index) => {
    const match = line.match(/^---\s*#(\d+)\s*$/)
    if (match) {
      const no = Number.parseInt(match[1])
      const note = lines[index + 1].trim()
      const slide = slides.find(s => s.no === no)
      if (slide) {
        slide.meta.slide.note = note
        useDynamicSlideInfo(no).update({ note })
      }
    }
  })
}

debouncedWatch(note, (value) => {
  deserializeNotes(value, slides.value)
}, { debounce: 300 })
</script>

<template>
  <Modal v-model="showHelp" class="px-6 py-4 flex flex-col gap-2">
    <div class="flex gap-2 text-xl">
      <div class="i-carbon:information my-auto" /> Help
    </div>
    <div class="prose dark:prose-invert">
      <p>This is the batch notes editor. You can edit the notes for all the slides at once here.</p>

      <p>The note for each slide are separated by <code>--- #[no]</code> lines, you might want to keep them while editing.</p>
    </div>
    <div class="flex my-1">
      <button class="slidev-form-button" @click="showHelp = false">
        Close
      </button>
    </div>
  </Modal>
  <div class="h-full">
    <div class="slidev-glass-effect fixed bottom-5 right-5 rounded-full border border-main">
      <IconButton title="Help" class="rounded-full" @click="showHelp = true">
        <div class="i-carbon:help text-2xl" />
      </IconButton>
    </div>
    <textarea
      v-model="note"
      class="prose dark:prose-invert resize-none p5 outline-none bg-transparent block h-full w-full! max-w-full! max-h-full! min-h-full! min-w-full!"
    />
  </div>
</template>

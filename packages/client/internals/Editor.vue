<script setup lang="ts">
import { throttledWatch, useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { activeElement, editorWidth, isInputting, showEditor } from '../state'
import { useCodeMirror } from '../setup/codemirror'
import { currentSlideId, openInEditor } from '../logic/nav'
import { useDynamicSlideInfo } from '../logic/note'

const tab = ref<'content' | 'note'>('content')
const content = ref('')
const note = ref('')
const dirty = ref(false)
const frontmatter = ref<any>({})
const contentInput = ref<HTMLTextAreaElement>()
const noteInput = ref<HTMLTextAreaElement>()

const { info, update } = useDynamicSlideInfo(currentSlideId)

watch(
  info,
  (v) => {
    frontmatter.value = v?.frontmatter || {}

    if (!isInputting.value) {
      note.value = (v?.note || '').trim()
      content.value = (v?.content || '').trim()
      dirty.value = false
    }
  },
  { immediate: true },
)

async function save() {
  dirty.value = false
  await update({
    raw: null!,
    note: note.value || undefined,
    content: content.value,
    // frontmatter: frontmatter.value,
  })
}

function close() {
  showEditor.value = false
}

useEventListener('keydown', (e) => {
  if (activeElement.value?.tagName === 'TEXTAREA' && e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
    save()
    e.preventDefault()
  }
})

onMounted(() => {
  useCodeMirror(
    contentInput,
    computed({
      get() { return content.value },
      set(v) {
        if (content.value.trim() !== v.trim()) {
          content.value = v
          dirty.value = true
        }
      },
    }),
    {
      mode: 'markdown',
      lineWrapping: true,
      // @ts-expect-error missing types
      highlightFormatting: true,
      fencedCodeBlockDefaultMode: 'javascript',
    },
  )

  useCodeMirror(
    noteInput,
    computed({
      get() { return note.value },
      set(v) {
        note.value = v
        dirty.value = true
      },
    }),
    {
      mode: 'markdown',
      lineWrapping: true,
      // @ts-expect-error missing types
      highlightFormatting: true,
      fencedCodeBlockDefaultMode: 'javascript',
    },
  )
})

const handlerDown = ref(false)
function onHandlerDown() {
  handlerDown.value = true
}
function updateWidth(v: number) {
  editorWidth.value = Math.min(Math.max(200, v), window.innerWidth - 200)
}
function switchTab(newTab: typeof tab.value) {
  tab.value = newTab
  // @ts-expect-error force cast
  document.activeElement?.blur?.()
}
useEventListener('pointermove', (e) => {
  if (handlerDown.value)
    updateWidth(window.innerWidth - e.pageX)
}, { passive: true })
useEventListener('pointerup', () => {
  handlerDown.value = false
})
useEventListener('resize', () => {
  updateWidth(editorWidth.value)
})

throttledWatch(
  [content, note],
  () => {
    if (dirty.value)
      save()
  },
  { throttle: 500 },
)
</script>

<template>
  <div
    class="fixed h-full top-0 bottom-0 w-10px bg-gray-400 select-none opacity-0 hover:opacity-10 z-100"
    :class="{ '!opacity-30': handlerDown }"
    :style="{ right: `${editorWidth - 5}px`, cursor: 'col-resize' }"
    @pointerdown="onHandlerDown"
  />
  <div
    class="shadow bg-main p-4 grid grid-rows-[max-content_1fr] h-full overflow-hidden border-l border-gray-400 border-opacity-20"
    :style="{ width: `${editorWidth}px` }"
  >
    <div class="flex pb-2 text-xl -mt-1">
      <div class="mr-4 rounded flex">
        <button class="slidev-icon-btn" :class="tab === 'content' ? 'text-$slidev-theme-primary' : ''" @click="switchTab('content')">
          <carbon:account />
        </button>
        <button class="slidev-icon-btn" :class="tab === 'note' ? 'text-$slidev-theme-primary' : ''" @click="switchTab('note')">
          <carbon:align-box-bottom-right />
        </button>
      </div>
      <span class="text-2xl pt-1">
        {{ tab === 'content' ? 'Slide' : 'Notes' }}
      </span>
      <div class="flex-auto" />
      <button class="slidev-icon-btn" @click="openInEditor()">
        <carbon:launch />
      </button>
      <button class="slidev-icon-btn" @click="close">
        <carbon:close />
      </button>
    </div>
    <div class="h-full overflow-auto">
      <div v-show="tab === 'content'" class="h-full overflow-auto">
        <textarea ref="contentInput" placeholder="Create slide content..." />
      </div>
      <div v-show="tab === 'note'" class="h-full overflow-auto">
        <textarea ref="noteInput" placeholder="Write some notes..." />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.CodeMirror {
  @apply px-3 py-2 h-full overflow-auto bg-transparent font-mono text-sm z-0;
}
</style>

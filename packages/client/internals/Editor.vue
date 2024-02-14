<script setup lang="ts">
import { throttledWatch, useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { activeElement, editorHeight, editorWidth, isInputting, showEditor, isEditorVertical as vertical } from '../state'
import { useCodeMirror } from '../setup/codemirror'
import { currentSlideId, openInEditor } from '../logic/nav'
import { useDynamicSlideInfo } from '../logic/note'
import HiddenText from './HiddenText.vue'

const props = defineProps<{
  resize?: boolean
}>()

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
function updateSize(v?: number) {
  if (vertical.value)
    editorHeight.value = Math.min(Math.max(300, v ?? editorHeight.value), window.innerHeight - 200)
  else
    editorWidth.value = Math.min(Math.max(318, v ?? editorWidth.value), window.innerWidth - 200)
}
function switchTab(newTab: typeof tab.value) {
  tab.value = newTab
  // @ts-expect-error force cast
  document.activeElement?.blur?.()
}

if (props.resize) {
  useEventListener('pointermove', (e) => {
    if (handlerDown.value) {
      updateSize(vertical.value
        ? window.innerHeight - e.pageY
        : window.innerWidth - e.pageX)
    }
  }, { passive: true })
  useEventListener('pointerup', () => {
    handlerDown.value = false
  })
  useEventListener('resize', () => {
    updateSize()
  })
}

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
    v-if="resize" class="fixed bg-gray-400 select-none opacity-0 hover:opacity-10 z-100"
    :class="vertical ? 'left-0 right-0 w-full h-10px' : 'top-0 bottom-0 w-10px h-full'" :style="{
      opacity: handlerDown ? '0.3' : undefined,
      bottom: vertical ? `${editorHeight - 5}px` : undefined,
      right: !vertical ? `${editorWidth - 5}px` : undefined,
      cursor: vertical ? 'row-resize' : 'col-resize',
    }" @pointerdown="onHandlerDown"
  />
  <div
    class="shadow bg-main p-4 grid grid-rows-[max-content_1fr] h-full overflow-hidden"
    :class="resize ? 'border-l border-gray-400 border-opacity-20' : ''"
    :style="resize ? {
      height: vertical ? `${editorHeight}px` : undefined,
      width: !vertical ? `${editorWidth}px` : undefined,
    } : {}"
  >
    <div class="flex pb-2 text-xl -mt-1">
      <div class="mr-4 rounded flex">
        <button class="slidev-icon-btn" :class="tab === 'content' ? 'text-$slidev-theme-primary' : ''" @click="switchTab('content')">
          <HiddenText text="Switch to content tab" />
          <carbon:account />
        </button>
        <button class="slidev-icon-btn" :class="tab === 'note' ? 'text-$slidev-theme-primary' : ''" @click="switchTab('note')">
          <HiddenText text="Switch to notes tab" />
          <carbon:align-box-bottom-right />
        </button>
      </div>
      <span class="text-2xl pt-1">
        {{ tab === 'content' ? 'Slide' : 'Notes' }}
      </span>
      <div class="flex-auto" />
      <button v-if="resize" class="slidev-icon-btn" @click="vertical = !vertical">
        <template v-if="vertical">
          <HiddenText text="Dock to right" />
          <carbon:open-panel-right />
        </template>
        <template v-else>
          <HiddenText text="Dock to bottom" />
          <carbon:open-panel-bottom />
        </template>
      </button>
      <button class="slidev-icon-btn" @click="openInEditor()">
        <HiddenText text="Open in editor" />
        <carbon:launch />
      </button>
      <button class="slidev-icon-btn" @click="close">
        <HiddenText text="Close" />
        <carbon:close />
      </button>
    </div>
    <div class="relative overflow-auto">
      <div :style="{ visibility: tab === 'content' ? 'visible' : 'hidden' }" class="absolute w-full h-full">
        <textarea ref="contentInput" placeholder="Create slide content..." />
      </div>
      <div :style="{ visibility: tab === 'note' ? 'visible' : 'hidden' }" class="absolute w-full h-full">
        <textarea ref="noteInput" placeholder="Write some notes..." />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.CodeMirror {
  @apply px-3 py-2 h-full overflow-hidden bg-transparent font-mono text-sm z-0;
}
</style>

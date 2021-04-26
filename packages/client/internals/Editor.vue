<script setup lang="ts">
import { useEventListener, useFetch } from '@vueuse/core'
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { activeElement, showEditor } from '../state'
import { useCodeMirror } from '../setup/codemirror'
import { currentRoute, currentSlideId } from '../logic/nav'
import { useDynamicSlideInfo } from '../logic/note'

const tab = ref<'content' | 'note'>('content')
const offsetRight = ref(0)
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
    content.value = (v?.content || '').trim()
    note.value = (v?.note || '').trim()
    frontmatter.value = v?.frontmatter || {}
    dirty.value = false
  },
  { immediate: true },
)

async function save() {
  dirty.value = false
  await update({
    raw: null!,
    note: note.value || undefined,
    content: content.value,
    frontmatter: frontmatter.value,
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
        content.value = v
        dirty.value = true
      },
    }),
    {
      mode: 'markdown',
      lineWrapping: true,
      // @ts-expect-error
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
      // @ts-expect-error
      highlightFormatting: true,
      fencedCodeBlockDefaultMode: 'javascript',
    },
  )
})

const width = ref(window.innerWidth * 0.4)

onMounted(() => {
  offsetRight.value = width.value
})
onUnmounted(() => {
  offsetRight.value = 0
})

const handlerDown = ref(false)
function onHandlerDown() {
  handlerDown.value = true
}
function updateWidth(v: number) {
  width.value = Math.min(Math.max(200, v), window.innerWidth - 200)
  offsetRight.value = width.value
}
useEventListener('pointermove', (e) => {
  if (handlerDown.value)
    updateWidth(window.innerWidth - e.pageX)
}, { passive: true })
useEventListener('pointerup', () => {
  handlerDown.value = false
})
useEventListener('resize', () => {
  updateWidth(width.value)
})

const editorLink = computed(() => {
  const slide = currentRoute.value?.meta?.slide
  return (slide?.file)
    ? `vscode-insiders://file/${slide.file}:${slide.start}`
    : undefined
})
</script>

<template>
  <div
    class="fixed h-full top-0 bottom-0 w-10px bg-gray-400 select-none opacity-0 hover:opacity-10 z-100"
    :class="{'!opacity-30': handlerDown}"
    :style="{right: `${width - 5}px`, cursor: 'col-resize'}"
    @pointerdown="onHandlerDown"
  ></div>
  <div
    class="shadow bg-main p-4 grid grid-rows-[max-content,1fr] h-full overflow-hidden border-l border-gray-400 border-opacity-20"
    :style="{width: `${width}px`}"
  >
    <div class="flex pb-2 text-xl -mt-1">
      <div class="mr-4 rounded flex">
        <button class="icon-btn" :class="tab === 'content' ? 'text-primary' : ''" @click="tab='content'">
          <carbon:account />
        </button>
        <button class="icon-btn" :class="tab === 'note' ? 'text-primary' : ''" @click="tab='note'">
          <carbon:align-box-bottom-right />
        </button>
      </div>
      <span class="text-2xl pt-1">
        {{ tab === 'content' ? 'Slide' : 'Note' }}
      </span>
      <div class="flex-auto"></div>
      <button class="icon-btn" :class="{ disabled: !dirty }" @click="save">
        <carbon:save />
      </button>
      <button class="icon-btn">
        <a :href="editorLink" target="_blank">
          <carbon:launch />
        </a>
      </button>
      <button class="icon-btn" @click="close">
        <carbon:close />
      </button>
    </div>
    <div class="h-full overflow-auto">
      <div v-show="tab === 'content'" class="h-full overflow-auto">
        <textarea ref="contentInput" />
      </div>
      <div v-show="tab === 'note'" class="h-full overflow-auto">
        <textarea ref="noteInput" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.CodeMirror {
  @apply px-3 py-2 h-full overflow-auto bg-transparent font-mono text-sm;
}
</style>

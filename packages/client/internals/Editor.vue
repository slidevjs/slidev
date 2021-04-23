<script setup lang="ts">
import { useEventListener, useFetch } from '@vueuse/core'
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useNavigateControls } from '../logic'
import { offsetRight } from '../logic/scale'
import { activeElement, showEditor } from '../logic/state'
import { useCodeMirror } from '../setup/codemirror'

const content = ref('')
const dirty = ref(false)
const frontmatter = ref<any>({})
const contentInput = ref<HTMLTextAreaElement>()

const controls = useNavigateControls()
const url = computed(() => `/@slidev/slide/${controls.currentRoute.value?.meta?.slide?.id}.json`)
const { data } = useFetch(
  url,
  { refetch: true },
).get().json()

watch(
  data,
  () => {
    content.value = (data.value?.content || '').trim()
    frontmatter.value = data.value?.frontmatter || {}
    dirty.value = false
  },
  { immediate: true },
)

async function save() {
  await fetch(
    url.value,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: null,
        content: content.value,
        frontmatter: frontmatter.value,
      }),
    },
  )
  dirty.value = false
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
      get() {
        return content.value
      },
      set(v) {
        content.value = v
        dirty.value = true
      },
    }),
    {
      mode: 'markdown',
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
useEventListener('pointermove', (e) => {
  if (handlerDown.value) {
    width.value = window.innerWidth - e.pageX
    offsetRight.value = width.value
  }
}, { passive: true })
useEventListener('pointerup', () => {
  handlerDown.value = false
})
</script>

<template>
  <div
    class="fixed h-full top-0 bottom-0 w-10px bg-gray-400 select-none opacity-0 hover:opacity-10 z-10"
    :class="{'!opacity-30': handlerDown}"
    :style="{right: `${width - 5}px`, cursor: 'col-resize'}"
    @pointerdown="onHandlerDown"
  ></div>
  <div
    class="fixed top-0 right-0 bottom-0 shadow bg-main p-4 grid grid-rows-[max-content,auto] h-full overflow-hidden"
    :style="{width: `${width}px`}"
  >
    <div class="flex pb-2 text-xl -mt-1">
      <span class="text-2xl pt-1">
        Slide Editor
      </span>
      <div class="flex-auto"></div>
      <button class="icon-btn" :class="{ disabled: !dirty }" @click="save">
        <carbon:save />
      </button>
      <button class="icon-btn" @click="close">
        <carbon:close />
      </button>
    </div>
    <textarea ref="contentInput" />
  </div>
</template>

<style lang="postcss">
.CodeMirror {
  @apply px-3 py-2 h-auto bg-transparent font-mono text-sm;
}
</style>

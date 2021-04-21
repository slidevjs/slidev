<script setup lang="ts">
import { useEventListener, useFetch } from '@vueuse/core'
import { computed, watch, ref } from 'vue'
import YAML from 'js-yaml'
import { useNavigateControls } from '../logic'
import { activeElement } from '../logic/state'

const content = ref('')
const dirty = ref(false)
const frontmatter = ref<any>({})
const controls = useNavigateControls()
const url = computed(() => `/@aslide/slide/${controls.currentPage.value}.json`)
const { data } = useFetch(
  url,
  {
    refetch: true,
  },
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

const frontmatterStr = computed<string>({
  get() {
    return YAML.safeDump(frontmatter.value)
  },
  set(v) {
    frontmatter.value = YAML.safeLoad(v)
  },
})

function save() {
  return fetch(
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
}

useEventListener('keydown', (e) => {
  if (activeElement.value?.tagName === 'TEXTAREA' && e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
    save()
    e.preventDefault()
  }
})

function onContentChange(e: Event) {
  content.value = ((e as InputEvent).target as HTMLTextAreaElement).value
  dirty.value = true
}
</script>

<template>
  <div class="fixed top-0 right-0 bottom-0 shadow bg-main w-1/2 p-4">
    <h1>Editor</h1>
    <textarea v-model="frontmatterStr" class="font-mono border border-gray-400 w-full h-40" />
    <textarea
      :value="content"
      class="font-mono border border-gray-400 w-full h-40"
      @input="onContentChange"
    />
    <button @click="save">
      Save
    </button>
  </div>
</template>

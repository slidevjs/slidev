<!--
Monaco Editor
(auto transformed, you don't need to use this component directly)

Usage:

```ts {monaco}
const your_code = 'here'
```

Learn more: https://sli.dev/guide/syntax.html#monaco-editor
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { decode } from 'js-base64'
import { nanoid } from 'nanoid'
import { isDark } from '../logic/dark'

const props = withDefaults(defineProps<{
  code: string
  diff?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  height?: number | string
}>(), {
  code: '',
  lang: 'typescript',
  readonly: false,
  lineNumbers: 'off',
  height: 'auto',
})

const id = nanoid()
const code = ref(decode(props.code).trimEnd())
const diff = ref(props.diff ? decode(props.diff).trimEnd() : null)
const lineHeight = +(getComputedStyle(document.body).getPropertyValue('--slidev-code-line-height') || '18').replace('px', '') || 18
const editorHeight = ref(0)
const calculatedHeight = computed(() => code.value.split(/\r?\n/g).length * lineHeight)
const height = computed(() => {
  return props.height === 'auto' ? `${Math.max(calculatedHeight.value, editorHeight.value) + 20}px` : props.height
})

const iframe = ref<HTMLIFrameElement>()

const cssVars = [
  '--slidev-code-font-size',
  '--slidev-code-font-family',
  '--slidev-code-background',
  '--slidev-code-line-height',
  '--slidev-code-padding',
  '--slidev-code-margin',
  '--slidev-code-radius',
]

function getStyleObject(el: Element) {
  const object: Record<string, string> = {}
  const style = getComputedStyle(el)
  for (const v of cssVars)
    object[v] = style.getPropertyValue(v)
  return object
}

onMounted(() => {
  const frame = iframe.value!
  frame.setAttribute('sandbox', [
    'allow-forms',
    'allow-modals',
    'allow-pointer-lock',
    'allow-popups',
    'allow-same-origin',
    'allow-scripts',
    'allow-top-navigation-by-user-activation',
  ].join(' '))

  let src = __DEV__
    ? `${location.origin}${__SLIDEV_CLIENT_ROOT__}/`
    : import.meta.env.BASE_URL
  src += `iframes/monaco/index.html?id=${id}&lineNumbers=${props.lineNumbers}&lang=${props.lang}`
  if (diff.value)
    src += '&diff=1'
  frame.src = src

  frame.style.backgroundColor = 'transparent'
})

function post(payload: any) {
  iframe.value?.contentWindow?.postMessage(
    JSON.stringify({
      type: 'slidev-monaco',
      data: payload,
      id,
    }),
    location.origin,
  )
}

useEventListener(window, 'message', ({ data: payload }) => {
  if (payload.id !== id)
    return
  if (payload.type === 'slidev-monaco-loaded') {
    if (iframe.value) {
      post({
        code: code.value,
        diff: diff.value,
        lang: props.lang,
        readonly: props.readonly,
        lineNumbers: props.lineNumbers,
        dark: isDark.value,
        style: Object.entries(getStyleObject(iframe.value)).map(([k, v]) => `${k}: ${v};`).join(''),
      })
    }
    return
  }
  if (payload.type !== 'slidev-monaco')
    return
  if (payload.data?.height)
    editorHeight.value = payload.data?.height
  if (payload?.data?.code && code.value !== payload.data.code)
    code.value = payload.data.code
  if (payload?.data?.diff && diff.value !== payload.data.diff)
    diff.value = payload.data.diff
})
</script>

<template>
  <iframe ref="iframe" class="text-base w-full rounded" :style="{ height }" />
</template>

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
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useEventListener } from '@vueuse/core'
import { decode } from 'js-base64'
import { nanoid } from 'nanoid'
import { isDark } from '../logic/dark'

const props = defineProps({
  code: {
    default: '',
  },
  lang: {
    default: 'typescript',
  },
  readonly: {
    default: false,
  },
  lineNumbers: {
    default: 'off',
  },
  height: {
    default: 'auto',
  },
})

const id = nanoid()
const code = ref(decode(props.code).trimEnd())
const lineHeight = +(getComputedStyle(document.body).getPropertyValue('--slidev-code-line-height') || '18').replace('px', '') || 18
const height = computed(() => props.height === 'auto' ? `${code.value.split(/\r?\n/g).length * lineHeight + 20}px` : props.height)
const isReady = ref(false)

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

  frame.src = __DEV__
    ? `${location.origin}${__SLIDEV_CLIENT_ROOT__}/iframes/monaco/index.html`
    : `${import.meta.env.BASE_URL}iframes/monaco/index.html`

  frame.style.backgroundColor = 'transparent'

  frame.addEventListener('load', () => {
    postCode()
    isReady.value = true
  }, { once: true })
})

function post(payload: any) {
  iframe.value?.contentWindow?.postMessage(
    JSON.stringify({
      type: 'slidev-monaco',
      data: payload,
    }),
    location.origin,
  )
}

function postCode() {
  post({
    code: code.value,
    lang: props.lang,
  })
}

function postStyle() {
  if (!iframe.value)
    return
  post({
    id,
    readonly: props.readonly,
    lineNumbers: props.lineNumbers,
    dark: isDark.value,
    style: Object.entries(getStyleObject(iframe.value)).map(([k, v]) => `${k}: ${v};`).join(''),
  })
}

useEventListener(window, 'message', ({ data: payload }) => {
  if (payload.type !== 'slidev-monaco' || payload.id !== id)
    return
  if (!payload?.data?.code || code.value === payload.data.code)
    return
  code.value = payload.data.code
})

watchEffect(() => {
  if (!isReady.value)
    return
  postStyle()
})
</script>

<template>
  <iframe ref="iframe" class="text-base w-full rounded" :style="{ height }" />
</template>

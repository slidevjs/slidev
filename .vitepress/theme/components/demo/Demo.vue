<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
// @ts-ignore
import TypeIt from 'typeit'
import Markdown from 'markdown-it'
import type { SlidevMarkdown } from '@slidev/types'
import { parse } from '../../../../../packages/parser/src/core'
import Default from '../../../../../packages/client/layouts/default.vue'
import Center from '../../../../../packages/client/layouts/center.vue'
import SlideContainer from '../../../../../packages/client/internals/SlideContainer.vue'
import Cover from '../../../../../packages/theme-default/layouts/cover.vue'
import '../../../../../packages/theme-default/styles/layout.css'

const page = ref(0)
const paused = ref(false)
const code = ref('')
const info = ref<SlidevMarkdown>()
const block = ref<HTMLPreElement>()

const markdown = new Markdown()

function getLayout(id: number) {
  const name = info.value?.slides?.[id]?.frontmatter?.layout || 'default'
  return name === 'cover'
    ? Cover
    : name === 'center'
      ? Center
      : Default
}

watch([code, paused], () => {
  if (paused.value)
    return
  try {
    info.value = parse(code.value)
  }
  catch (e) {

  }
})

function getAttrs(id: number) {
  return info.value?.slides?.[id]?.frontmatter
}

function getHTML(id: number) {
  const content = info?.value?.slides?.[id]?.content
  if (!content)
    return ''
  return markdown.render(content)
}

function pause() {
  paused.value = true
}
function resume() {
  paused.value = false
}

const COVER_URL = 'https://slidev.antfu.me/demo-cover.png'
const img1 = new Image()
img1.src = COVER_URL

onMounted(() => {
  new TypeIt(block.value, {
    speed: 50,
    startDelay: 900,
    afterStep: () => {
      code.value = JSON.parse(JSON.stringify(block.value!.innerText.replace('|', '')))
    },
  })
    .type('<br><span class="token title"># Welcome to Slidev!</span><br><br>', { delay: 400 })
    .type('Presentation Slides for Developers', { delay: 400 })
    .move('START', { speed: 0 })
    .type('<br>')
    .move('START')
    .exec(pause)
    .type('<span class="token punctuation">---<br><br>---</span>')
    .move(-4)
    .type('<span class="token tag">layout:</span> center')
    .exec(resume)
    .pause(1000)
    .exec(pause)
    .delete(6, { delay: 100, speed: 50 })
    .type('cover')
    .exec(resume)
    .exec(pause)
    .pause(1000)
    .type('<br>')
    .type('<span class="token tag">background:</span> ', { delay: 200 })
    .type(COVER_URL, { speed: 0 })
    .exec(resume)
    .pause(1000)
    .move('END', { speed: 0 })
    .exec(pause)
    .type('<br><br><span class="token punctuation">---</span><br><br>', { delay: 400 })
    .exec(resume)
    .exec(() => setTimeout(() => page.value = 1))
    .type('<span class="token title"># Page 2</span><br><br>', { delay: 400 })
    .type('- 📄 Write slides in a single Markdown file<br>', { delay: 800 })
    .type('- 🌈 Themes, code blocks, interactive components<br>', { delay: 800 })
    .type('- 😎 Read the docs to learn more!', { delay: 800 })
    .exec(() => setTimeout(() => page.value = 0))
    .go()
})
</script>

<template>
  <div>
    <DemoEditor>
      <div class="text-sm opacity-50">
        ./slides.md
      </div>

      <div class="language-md !bg-transparent">
        <pre ref="block" class="text-left whitespace-normal font-mono bg-transparent"></pre>
      </div>
    </DemoEditor>

    <DemoSlide class="text-left">
      <div
        class="flex h-full dark:bg-[#181819] transition-transform transform duration-500"
        style="width: 200%"
        :class="page === 1 ? '-translate-x-1/2': ''"
      >
        <SlideContainer class="w-full h-full">
          <component :is="getLayout(0)" v-bind="getAttrs(0)">
            <div v-html="getHTML(0)"></div>
          </component>
        </SlideContainer>
        <SlideContainer class="w-full h-full">
          <component :is="getLayout(1)" v-bind="getAttrs(1)">
            <div v-html="getHTML(1)"></div>
          </component>
        </SlideContainer>
      </div>
      <div class="l"></div>
    </DemoSlide>
  </div>
</template>

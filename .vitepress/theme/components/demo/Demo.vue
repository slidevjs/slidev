<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, computed } from 'vue'
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

const paused = ref(false)
const code = ref('')
const html = ref('')
const info = ref<SlidevMarkdown>()
const block = ref<HTMLPreElement>()
const layout = shallowRef<any>(Default)

const markdown = new Markdown()

watch([code, paused], () => {
  if (paused.value)
    return
  try {
    info.value = parse(code.value)
    html.value = markdown.render(info.value.slides[0].content)
    const name = info.value?.slides?.[0]?.frontmatter?.layout || 'default'
    layout.value = name === 'cover'
      ? Cover
      : name === 'center'
        ? Center
        : Default
  }
  catch (e) {

  }
})

const attrs = computed(() => info.value?.slides?.[0]?.frontmatter)

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
    .type('<br><br><span class="token punctuation">---</span><br><br>', { delay: 400 })
    .type('<span class="token title"># Page 2</span><br><br>', { delay: 400 })
    .type('- 📄 Write sldies in a simple Markdown file<br>', { delay: 800 })
    .type('- 🌈 Themes, code blocks, interactive components<br>', { delay: 800 })
    .type('- 😎 Read the docs to learn more!', { delay: 800 })
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
        <pre
          ref="block"
          class="text-left whitespace-normal font-mono bg-transparent"
        ></pre>
      </div>
    </DemoEditor>

    <DemoSlide class="text-left">
      <SlideContainer class="w-full h-full">
        <component :is="layout" v-bind="{...attrs}">
          <div v-html="html"></div>
        </component>
      </SlideContainer>
    </DemoSlide>
  </div>
</template>

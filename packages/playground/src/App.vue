<script setup lang="ts">
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { defaultContent } from './default-content'
import { parseMarkdown } from './parser'
import { renderMarkdown } from './renderer'
import './styles/transitions.css'

// State
const markdown = ref('')
const presenting = ref(false)
const currentSlide = ref(0)
const navDirection = ref<'forward' | 'backward'>('forward')
const dragging = ref(false)
const splitPercent = ref(50)

// Load from URL hash or use default
onMounted(() => {
  const hash = window.location.hash.slice(1)
  if (hash) {
    try {
      const decoded = decompressFromEncodedURIComponent(hash)
      if (decoded)
        markdown.value = decoded
      else
        markdown.value = defaultContent
    }
    catch {
      markdown.value = defaultContent
    }
  }
  else {
    markdown.value = defaultContent
  }
})

// Parsed slides
const parsed = computed(() => parseMarkdown(markdown.value))

const renderedSlides = computed(() =>
  parsed.value.slides.map(slide => ({
    ...slide,
    html: renderMarkdown(slide.content),
    layout: slide.frontmatter.layout || 'default',
  })),
)

const transitionName = computed(() => navDirection.value === 'forward' ? 'slide-left' : 'slide-right')

// Share URL
function shareUrl() {
  const compressed = compressToEncodedURIComponent(markdown.value)
  window.location.hash = compressed
  navigator.clipboard.writeText(window.location.href)
}

// Debounced URL update
let urlTimer: ReturnType<typeof setTimeout>
watch(markdown, () => {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    const compressed = compressToEncodedURIComponent(markdown.value)
    history.replaceState(null, '', `#${compressed}`)
  }, 1000)
})

// Presentation mode
function startPresenting(slideIndex = 0) {
  currentSlide.value = slideIndex
  presenting.value = true
}

function stopPresenting() {
  presenting.value = false
}

function nextSlide() {
  if (currentSlide.value < renderedSlides.value.length - 1) {
    navDirection.value = 'forward'
    currentSlide.value++
  }
}

function prevSlide() {
  if (currentSlide.value > 0) {
    navDirection.value = 'backward'
    currentSlide.value--
  }
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!presenting.value)
    return

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault()
      prevSlide()
      break
    case 'Escape':
      e.preventDefault()
      stopPresenting()
      break
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

// Slide scaling
const previewRef = ref<HTMLElement | null>(null)
const slideScale = ref(0.4)

function updateScale() {
  if (!previewRef.value)
    return
  // Slide padding (24px each side) + slide-number space
  const availableWidth = previewRef.value.clientWidth - 48 - 32
  slideScale.value = Math.min(1, availableWidth / 960)
}

onMounted(() => {
  const ro = new ResizeObserver(updateScale)
  if (previewRef.value)
    ro.observe(previewRef.value)
  updateScale()
})

// Split pane drag
function startDrag() {
  dragging.value = true
}

function onDrag(e: MouseEvent) {
  if (!dragging.value)
    return
  const pct = (e.clientX / window.innerWidth) * 100
  splitPercent.value = Math.max(20, Math.min(80, pct))
  updateScale()
}

function stopDrag() {
  dragging.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
})
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <!-- Presentation Mode -->
  <div v-if="presenting" class="present-overlay" @click.self="stopPresenting">
    <div class="present-slide">
      <Transition :name="transitionName" mode="out-in">
        <div
          :key="currentSlide"
          class="slide-content"
          :class="`layout-${renderedSlides[currentSlide]?.layout}`"
        >
          <div v-html="renderedSlides[currentSlide]?.html" />
        </div>
      </Transition>
    </div>

    <div class="present-controls">
      <span class="slide-counter">{{ currentSlide + 1 }} / {{ renderedSlides.length }}</span>
      <button :disabled="currentSlide === 0" @click="prevSlide">
        Prev
      </button>
      <button :disabled="currentSlide === renderedSlides.length - 1" @click="nextSlide">
        Next
      </button>
      <button @click="stopPresenting">
        Exit
      </button>
    </div>

    <!-- Click zones for navigation -->
    <div class="click-zone click-zone-left" @click="prevSlide" />
    <div class="click-zone click-zone-right" @click="nextSlide" />
  </div>

  <!-- Editor Layout -->
  <div v-else class="playground">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <svg viewBox="0 0 100 100" width="24" height="24" class="logo">
          <polygon points="50,10 90,90 10,90" fill="#4FC08D" />
        </svg>
        <h1>Slidev Playground</h1>
      </div>
      <div class="header-actions">
        <span class="slide-badge">{{ renderedSlides.length }} slides</span>
        <button class="btn btn-secondary" title="Copy shareable URL" @click="shareUrl">
          Share
        </button>
        <button class="btn btn-primary" @click="startPresenting(0)">
          Present
        </button>
      </div>
    </header>

    <!-- Split Pane -->
    <div class="split-pane">
      <div class="editor-pane" :style="{ width: `${splitPercent}%` }">
        <div class="pane-header">
          <span>slides.md</span>
        </div>
        <textarea
          v-model="markdown"
          class="editor"
          spellcheck="false"
          placeholder="Write your Slidev markdown here..."
        />
      </div>

      <div class="divider" @mousedown.prevent="startDrag" />

      <div class="preview-pane" :style="{ width: `${100 - splitPercent}%` }">
        <div class="pane-header">
          <span>Preview</span>
        </div>
        <div ref="previewRef" class="preview-scroll">
          <div
            v-for="(slide, i) in renderedSlides"
            :key="i"
            class="preview-slide-wrapper"
            @click="startPresenting(i)"
          >
            <div class="slide-number">
              {{ i + 1 }}
            </div>
            <div class="preview-slide" :style="{ height: `${540 * slideScale}px` }">
              <div
                class="slide-content"
                :class="`layout-${slide.layout}`"
                :style="{ transform: `scale(${slideScale})` }"
              >
                <div v-html="slide.html" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #0a0a0a;
  --bg-editor: #1e1e1e;
  --bg-surface: #161616;
  --bg-slide: #ffffff;
  --border: #2d2d2d;
  --text: #e0e0e0;
  --text-dim: #888;
  --accent: #4fc08d;
  --accent-hover: #42a97a;
  --slide-width: 960;
  --slide-height: 540;
  --slide-ratio: calc(var(--slide-height) / var(--slide-width));
}

html,
body {
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  height: 100%;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h1 {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slide-badge {
  font-size: 12px;
  color: var(--text-dim);
  padding: 2px 8px;
  background: var(--border);
  border-radius: 10px;
}

.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: var(--accent);
  color: #000;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #3a3a3a;
}

/* Playground layout */
.playground {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Split pane */
.split-pane {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.divider {
  width: 4px;
  background: var(--border);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}

.divider:hover {
  background: var(--accent);
}

/* Editor */
.editor-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-header {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-dim);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}

.editor {
  flex: 1;
  padding: 16px;
  background: var(--bg-editor);
  color: #d4d4d4;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.editor::placeholder {
  color: #555;
}

/* Preview */
.preview-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

.preview-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-slide-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.preview-slide-wrapper:hover .preview-slide {
  box-shadow: 0 0 0 2px var(--accent);
}

.slide-number {
  position: absolute;
  top: 8px;
  left: -28px;
  font-size: 12px;
  color: var(--text-dim);
  width: 24px;
  text-align: right;
}

.preview-slide {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.15s;
}

/* Slide content — shared between preview and present */
.slide-content {
  width: 960px;
  height: 540px;
  background: var(--bg-slide);
  color: #1a1a1a;
  padding: 48px 64px;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: 18px;
  line-height: 1.6;
  transform-origin: top left;
  overflow: hidden;
}

/* Scale slide to fit container */
.preview-slide .slide-content {
  /* Scale is calculated by JS but we use container-based scaling */
  --scale: 1;
  transform: scale(var(--scale));
}

/* Layout variants */
.layout-cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.layout-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.layout-default {
  display: flex;
  flex-direction: column;
}

/* Slide typography */
.slide-content h1 {
  font-size: 2.4em;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.4em;
  color: #111;
}

.slide-content h2 {
  font-size: 1.8em;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.4em;
  color: #222;
}

.slide-content h3 {
  font-size: 1.3em;
  font-weight: 600;
  margin-bottom: 0.3em;
  color: #333;
}

.slide-content p {
  margin-bottom: 0.8em;
  color: #444;
}

.slide-content ul,
.slide-content ol {
  margin-bottom: 0.8em;
  padding-left: 1.4em;
}

.slide-content li {
  margin-bottom: 0.3em;
  color: #444;
}

.slide-content code {
  background: #f0f0f0;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: 'Fira Code', monospace;
  color: #e44;
}

.slide-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 0.8em;
  font-size: 0.82em;
  line-height: 1.6;
}

.slide-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

.slide-content blockquote {
  border-left: 4px solid var(--accent);
  padding: 8px 16px;
  margin-bottom: 0.8em;
  color: #555;
  background: #f8f8f8;
  border-radius: 0 6px 6px 0;
}

.slide-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.8em;
}

.slide-content th,
.slide-content td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.slide-content th {
  background: #f5f5f5;
  font-weight: 600;
}

.slide-content a {
  color: var(--accent);
  text-decoration: none;
}

.slide-content a:hover {
  text-decoration: underline;
}

.slide-content strong {
  font-weight: 600;
  color: #222;
}

/* Presentation mode */
.present-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.present-slide {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.present-slide .slide-content {
  transform-origin: center center;
}

@supports (transform: scale(1)) {
  .present-slide .slide-content {
    transform: scale(min(calc(100vw / 960), calc(100vh / 540)));
  }
}

.present-controls {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1001;
}

.present-overlay:hover .present-controls {
  opacity: 1;
}

.present-controls button {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.present-controls button:hover {
  background: rgba(255, 255, 255, 0.25);
}

.present-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.slide-counter {
  color: #aaa;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* Click zones for presentation navigation */
.click-zone {
  position: fixed;
  top: 0;
  bottom: 60px;
  width: 30%;
  z-index: 1001;
  cursor: pointer;
}

.click-zone-left {
  left: 0;
}

.click-zone-right {
  right: 0;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>

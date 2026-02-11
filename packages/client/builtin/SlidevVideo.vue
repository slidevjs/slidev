<script setup lang="ts">
import { and } from '@vueuse/math'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNav } from '../composables/useNav'
import { useSlideContext } from '../context'
import { resolvedClickMap } from '../modules/v-click'

const props = defineProps<{
  autoplay?: boolean | 'once'
  autoreset?: 'slide' | 'click'
  poster?: string
  printPoster?: string
  timestamp?: string | number
  printTimestamp?: string | number | 'last'
  controls?: boolean
  pause?: (number | 'end')[]
}>()

const printPoster = computed(() => props.printPoster ?? props.poster)
const printTimestamp = computed(() => props.printTimestamp ?? props.timestamp ?? 0)

const { $slidev, $renderContext, $route } = useSlideContext()
const { isPrintMode } = useNav()

const noPlay = computed(() => isPrintMode.value || !['slide', 'presenter'].includes($renderContext.value))

const video = ref<HTMLMediaElement>()
const played = ref(false)

const currentInterval = ref<any>(null)
const pauseTimestamps = computed(() => {
  if (!props.pause || props.pause.length === 0)
    return null

  const segments: (number | 'end')[] = [0]
  for (const segment of props.pause) {
    const last = segments[segments.length - 1]
    if (segment === 'end') {
      segments.push('end')
    }
    else {
      const lastNum = typeof last === 'number' ? last : 0
      segments.push(lastNum + segment)
    }
  }
  return segments
})

const pauseIndex = ref(1)
const userTriggeredPlay = ref(false)

function playNextSegment() {
  if (!pauseTimestamps.value || !video.value) {
    video.value?.play()
    return
  }

  const from = pauseTimestamps.value[pauseIndex.value - 1]
  const to = pauseTimestamps.value[pauseIndex.value]

  if (from == null || to == null)
    return

  if (typeof from === 'number')
    video.value.currentTime = from

  userTriggeredPlay.value = false
  video.value.play()

  if (to === 'end') {
    pauseIndex.value++
    return
  }

  if (currentInterval.value)
    clearInterval(currentInterval.value)

  currentInterval.value = setInterval(() => {
    if (!video.value)
      return
    if (video.value.currentTime >= to) {
      video.value.pause()
      clearInterval(currentInterval.value)
      pauseIndex.value++
    }
  }, 100)
}

function onPlay() {
  played.value = true

  if (pauseTimestamps.value && userTriggeredPlay.value && video.value) {
    userTriggeredPlay.value = false
    video.value.pause()
    setTimeout(() => {
      playNextSegment()
    }, 0)
  }
}

onMounted(() => {
  if (noPlay.value)
    return

  const timestamp = +(props.timestamp ?? 0)
  video.value!.currentTime = timestamp

  const matchRoute = computed(() => !!$route && $route.no === $slidev?.nav.currentSlideNo)
  const matchClick = computed(() => !!video.value && (resolvedClickMap.get(video.value)?.isShown?.value ?? true))
  const matchRouteAndClick = and(matchRoute, matchClick)

  watch(matchRouteAndClick, () => {
    if (matchRouteAndClick.value) {
      if (props.autoplay === true || (props.autoplay === 'once' && !played.value)) {
        if (pauseTimestamps.value) {
          userTriggeredPlay.value = false
          playNextSegment()
        }
        else {
          video.value!.play()
        }
      }
    }
    else {
      video.value!.pause()
      if (currentInterval.value)
        clearInterval(currentInterval.value)
      if (props.autoreset === 'click' || (props.autoreset === 'slide' && !matchRoute.value)) {
        video.value!.currentTime = timestamp
        pauseIndex.value = 1
        userTriggeredPlay.value = false
      }
    }
  }, { immediate: true })
})

onBeforeUnmount(() => {
  if (currentInterval.value)
    clearInterval(currentInterval.value)
})

function onLoadedMetadata(ev: Event) {
  // The video may be loaded before component mounted
  const element = ev.target as HTMLMediaElement
  if (noPlay.value && (!printPoster.value || props.printTimestamp)) {
    element.currentTime = printTimestamp.value === 'last'
      ? element.duration
      : +printTimestamp.value
  }
}
</script>

<template>
  <video
    ref="video"
    :poster="noPlay ? printPoster : props.poster"
    :controls="!noPlay && props.controls"
    @play="onPlay"
    @loadedmetadata="onLoadedMetadata"
    @click="pauseTimestamps ? userTriggeredPlay = true : null"
  >
    <slot />
  </video>
</template>

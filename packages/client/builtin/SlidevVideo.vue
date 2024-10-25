<script setup lang="ts">
import { and } from '@vueuse/math'
import { computed, onMounted, ref, watch } from 'vue'
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
}>()

const printPoster = computed(() => props.printPoster ?? props.poster)
const printTimestamp = computed(() => props.printTimestamp ?? props.timestamp ?? 0)

const { $slidev, $renderContext, $route } = useSlideContext()
const { isPrintMode } = useNav()

const noPlay = computed(() => isPrintMode.value || !['slide', 'presenter'].includes($renderContext.value))

const video = ref<HTMLMediaElement>()
const played = ref(false)

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
      if (props.autoplay === true || (props.autoplay === 'once' && !played.value))
        video.value!.play()
    }
    else {
      video.value!.pause()
      if (props.autoreset === 'click' || (props.autoreset === 'slide' && !matchRoute.value))
        video.value!.currentTime = timestamp
    }
  }, { immediate: true })
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
    @play="played = true"
    @loadedmetadata="onLoadedMetadata"
  >
    <slot />
  </video>
</template>

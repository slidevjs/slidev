<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'

import { injectionClicks, injectionClicksDisabled, injectionClicksElements, injectionRoute, injectionSlideContext, injectionSlidevContext } from '../constants'

const props = defineProps<{
  autoPlay?: boolean | 'once' | 'resume' | 'resumeOnce'
  autoPause?: 'slide' | 'click'
  autoReset?: 'slide' | 'click'
}>()

const $slidev = inject(injectionSlidevContext)
const route = inject(injectionRoute)
const currentContext = inject(injectionSlideContext)
const clicks = inject(injectionClicks)
const clicksDisabled = inject(injectionClicksDisabled)
const clicksElements = inject(injectionClicksElements)

const video = ref<HTMLMediaElement>()
const played = ref(false)
const ended = ref(false)

const matchRoute = computed(() => {
  if (!video.value || currentContext !== 'slide')
    return false
  return route === $slidev?.nav.currentRoute
})

const matchClick = computed(() => {
  if (!video.value || currentContext !== 'slide' || clicks?.value === undefined || clicksDisabled?.value)
    return false
  return !clicksElements?.value.includes(video.value) || clicksElements?.value[clicks?.value - 1] === video.value
})

const matchRouteAndClick = computed(() => matchRoute.value && matchClick.value)

watch(matchRouteAndClick, () => {
  if (!video.value || currentContext !== 'slide')
    return

  if (matchRouteAndClick.value) {
    if (props.autoReset === 'click')
      video.value.currentTime = 0
    if (props.autoPlay && (!played.value || props.autoPlay === 'resume' || (props.autoPlay === 'resumeOnce' && !ended.value)))
      video.value.play()
  }

  if ((props.autoPause === 'click' && !matchRouteAndClick.value) || (props.autoPause === 'slide' && !matchRoute.value))
    video.value.pause()
})

watch(matchRoute, () => {
  if (!video.value || currentContext !== 'slide')
    return

  if (matchRoute.value && props.autoReset === 'slide')
    video.value.currentTime = 0
})

function onPlay() {
  played.value = true
}

function onEnded() {
  ended.value = true
}

onMounted(() => {
  if (!video.value || currentContext !== 'slide')
    return
  video.value?.addEventListener('play', onPlay)
  video.value?.addEventListener('ended', onEnded)
})

onUnmounted(() => {
  if (!video.value || currentContext !== 'slide')
    return
  video.value?.removeEventListener('play', onPlay)
  video.value?.removeEventListener('ended', onEnded)
})
</script>

<template>
  <video ref="video">
    <slot />
  </video>
</template>

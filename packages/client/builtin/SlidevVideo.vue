<script setup lang="ts">
import videojs from 'video.js'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import 'video.js/dist/video-js.css'

const props = defineProps<{
  pause?: (number | 'end')[]
  poster?: string
  controls?: boolean
}>()

const videoRef = ref()
const player = ref<ReturnType<typeof videojs> | null>(null)
const currentInterval = ref<any>(null)

const rawPause = props.pause ?? []
const pauseTimestamps = computed(() => {
  const out: (number | 'end')[] = [0]
  for (const segment of rawPause) {
    const last = out[out.length - 1]
    if (segment === 'end') {
      out.push('end')
    }
    else {
      const lastNum = typeof last === 'number' ? last : 0
      out.push(lastNum + segment)
    }
  }
  return out
})

const pauseIndex = ref(1)
const isPlaying = ref(false)

function playNextSegment() {
  const from = pauseTimestamps.value[pauseIndex.value - 1]
  const to = pauseTimestamps.value[pauseIndex.value]

  if (!player.value || from == null || to == null)
    return

  if (typeof from === 'number') {
    player.value.currentTime(from)
  }

  try {
    isPlaying.value = true
    player.value.play()
  }
  catch {
    isPlaying.value = false
    return
  }

  if (to === 'end') {
    pauseIndex.value++
    return
  }

  if (currentInterval.value)
    clearInterval(currentInterval.value)

  currentInterval.value = setInterval(() => {
    if (!player.value)
      return
    if (player.value.currentTime() >= to) {
      player.value.pause()
      clearInterval(currentInterval.value)
      isPlaying.value = false
      pauseIndex.value++
    }
  }, 100)
}

onMounted(() => {
  player.value = videojs(videoRef.value, {
    controls: props.controls !== false,
    autoplay: false,
    preload: 'auto',
    poster: props.poster,
  })

  player.value.ready(() => {
    player.value.controls(true)
    player.value.trigger('resize')
    player.value.pause()
    player.value.currentTime(0)

    player.value.on('play', () => {
      if (!isPlaying.value) {
        playNextSegment()
      }
      else {
        player.value?.pause()
      }
    })
  })
})

onBeforeUnmount(() => {
  if (currentInterval.value)
    clearInterval(currentInterval.value)
  player.value?.dispose()
})
</script>

<template>
  <video ref="videoRef" class="video-js vjs-default-skin" playsinline>
    <slot />
  </video>
</template>

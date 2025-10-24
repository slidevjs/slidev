import { parseTimeString } from '@slidev/parser/utils'
import { useInterval } from '@vueuse/core'
import { computed, toRef } from 'vue'
import { configs } from '../env'
import { sharedState } from '../state/shared'

export function useTimer() {
  const mode = computed(() => configs.timer || 'stopwatch')
  const duration = computed(() => parseTimeString(configs.duration).seconds)
  const interval = useInterval(100, { controls: true })

  const state = toRef(sharedState, 'timer')
  const status = computed(() => state.value?.status)
  const passedMs = computed(() => {
    // eslint-disable-next-line ts/no-unused-expressions
    interval.counter.value
    if (state.value.status === 'stopped' || !state.value.startedAt)
      return 0
    return Date.now() - state.value.startedAt
  })
  const passed = computed(() => passedMs.value / 1000)
  const percentage = computed(() => passed.value / duration.value * 100)

  const timer = computed(() => {
    if (mode.value === 'stopwatch') {
      if (state.value.status === 'stopped' || !state.value.startedAt)
        return { h: '', m: '-', s: '--', ms: '-' }
    }

    const total = mode.value === 'countdown'
      ? duration.value * 1000 - passedMs.value
      : passedMs.value

    let h = Math.floor(total / 1000 / 60 / 60).toString()
    if (h === '0')
      h = ''
    let min = Math.floor(total / 1000 / 60 % 60).toString()
    if (h)
      min = min.padStart(2, '0')
    const sec = Math.floor(total / 1000 % 60).toString().padStart(2, '0')
    const ms = Math.floor(total % 1000 / 100).toString()

    return {
      h,
      m: min,
      s: sec,
      ms,
    }
  })

  function reset() {
    interval.pause()
    state.value = {
      status: 'stopped',
      slides: {},
      startedAt: 0,
      pausedAt: 0,
    }
  }

  function resume() {
    if (!state.value)
      return
    if (state.value?.status === 'stopped') {
      state.value.status = 'running'
      state.value.startedAt = Date.now()
    }
    else if (state.value.status === 'paused') {
      state.value.status = 'running'
      state.value.startedAt = Date.now() - (state.value.pausedAt - state.value.startedAt)
    }
    interval.resume()
  }

  function pause() {
    state.value.status = 'paused'
    state.value.pausedAt = Date.now()
    interval.pause()
  }

  function toggle() {
    if (state.value.status === 'running') {
      pause()
    }
    else {
      resume()
    }
  }

  return {
    state,
    status,
    timer,
    reset,
    toggle,
    resume,
    pause,
    passed,
    percentage,
    duration,
    mode,
  }
}

import { useInterval } from '@vueuse/core'
import { computed, toRef } from 'vue'
import { sharedState } from '../state/shared'

export function useTimer() {
  const interval = useInterval(100, { controls: true })

  const state = toRef(sharedState, 'timerStatus')
  const timer = computed(() => {
    if (sharedState.timerStatus === 'stopped' && sharedState.timerStartedAt === 0)
      return { h: '', m: '-', s: '--', ms: '-' }
    // eslint-disable-next-line ts/no-unused-expressions
    interval.counter.value
    const passed = (Date.now() - sharedState.timerStartedAt)
    let h = Math.floor(passed / 1000 / 60 / 60).toString()
    if (h === '0')
      h = ''
    let min = Math.floor(passed / 1000 / 60).toString()
    if (h)
      min = min.padStart(2, '0')
    const sec = Math.floor(passed / 1000 % 60).toString().padStart(2, '0')
    const ms = Math.floor(passed % 1000 / 100).toString()
    return { h, m: min, s: sec, ms }
  })

  function reset() {
    interval.pause()
    sharedState.timerStatus = 'stopped'
    sharedState.timerStartedAt = 0
    sharedState.timerPausedAt = 0
  }

  function resume() {
    if (sharedState.timerStatus === 'stopped') {
      sharedState.timerStatus = 'running'
      sharedState.timerStartedAt = Date.now()
    }
    else if (sharedState.timerStatus === 'paused') {
      sharedState.timerStatus = 'running'
      sharedState.timerStartedAt = Date.now() - (sharedState.timerPausedAt - sharedState.timerStartedAt)
    }
    interval.resume()
  }

  function pause() {
    sharedState.timerStatus = 'paused'
    sharedState.timerPausedAt = Date.now()
    interval.pause()
  }

  function toggle() {
    if (sharedState.timerStatus === 'running') {
      pause()
    }
    else {
      resume()
    }
  }

  return {
    state,
    timer,
    reset,
    toggle,
    resume,
    pause,
  }
}

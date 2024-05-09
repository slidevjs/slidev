import type { Ref } from '@vue/runtime-core'
import { reactive, watch } from '@vue/runtime-core'

const versionRE = /<meta name="slidev:version" content="([^"]+)">/
const entryRE = /<meta charset="slidev:entry" content="([^"]+)">/

async function pingPort(port: number, forceEntry?: string) {
  let message = ''
  let compatMode = false
  let entry: string | null = null

  async function pingUrl(url: string) {
    try {
      const text = await (await fetch(url)).text()
      if (!text.match(/slidev/i))
        return false
      // Use semver to compare in the future
      compatMode = !text.match(versionRE)
      const detectedEntry = text.match(entryRE)?.[1]
      if (detectedEntry) {
        if (forceEntry && forceEntry.toLowerCase() !== detectedEntry.toLowerCase())
          return false
        entry = detectedEntry
      }
      return true
    }
    catch (err) {
      message = String(err)
    }
    return false
  }

  // We can't use `localhost:` here
  const ready = await pingUrl(`http://[::1]:${port}`) || await pingUrl(`http://127.0.0.1:${port}`)

  return {
    ready,
    message,
    compatMode,
    entry,
  }
}

export function useServerDetector(port: Ref<number | null>, forceEntry?: string) {
  const state = reactive({
    ready: false,
    message: '',
    compatMode: false,
    entry: null as string | null,
  })

  let isWorking = false
  async function refresh() {
    if (!port.value) {
      state.ready = false
      return
    }
    if (isWorking)
      return
    isWorking = true
    Object.assign(state, await pingPort(port.value, forceEntry))
    isWorking = false
  }

  watch(port, refresh, { immediate: true })

  return {
    state,
    refresh,
  }
}

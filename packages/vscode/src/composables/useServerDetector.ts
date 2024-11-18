import type { Ref } from 'reactive-vscode'
import { reactive, watch } from 'reactive-vscode'

const versionRE = /<meta name="slidev:version" content="([^"]+)">/
const entryRE = /<meta charset="slidev:entry" content="([^"]+)">/

export function useServerDetector(port: Ref<number | null>, ensureEntry?: string) {
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

    async function pingUrl(url: string) {
      try {
        const text = await (await fetch(url)).text()
        if (!text.match(/slidev/i))
          return false
        // Use semver to compare in the future
        state.compatMode = !text.match(versionRE)
        const detectedEntry = text.match(entryRE)?.[1]
        if (detectedEntry) {
          if (ensureEntry && ensureEntry.toLowerCase() !== detectedEntry.toLowerCase())
            return false
          state.entry = detectedEntry
        }
        return true
      }
      catch (err) {
        state.message = String(err)
      }
      return false
    }

    // We can't use `localhost:` here
    state.ready = await pingUrl(`http://[::1]:${port.value}`) || await pingUrl(`http://127.0.0.1:${port.value}`)

    isWorking = false
  }

  watch(port, refresh, { immediate: true })

  return {
    state,
    refresh,
  }
}

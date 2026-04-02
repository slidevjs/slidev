import type { SlidevProject } from '../projects'
import { createControlledPromise } from '@antfu/utils'
import { getPort as getPortPlease } from 'get-port-please'
import { computed, defineService, onScopeDispose, reactive, watch } from 'reactive-vscode'
import { config } from '../configs'
import { activeProject, askAddProject, projects, scannedProjects } from '../projects'
import { logger } from '../views/logger'

const versionRE = /<meta (?:name|property)="slidev:version" content="([^"]+)">/
const entryRE = /<meta (?:property|charset)="slidev:entry" content="([^"]+)">/

export interface DetectedServerState {
  port: number
  ready: boolean
  message: string
  compatMode: boolean
  entry: string | null
  pending: Promise<boolean> | null
}

export const useServerDetector = defineService(() => {
  const detectedPorts = reactive(new Map<number, DetectedServerState>())

  async function redetect(port: number) {
    const state = detectedPorts.get(port) || reactive<DetectedServerState>({
      port,
      ready: false,
      message: '',
      compatMode: false,
      entry: null,
      pending: null,
    })
    detectedPorts.set(port, state)

    if (state.pending)
      return state.pending
    const { resolve } = state.pending = createControlledPromise()

    async function pingUrl(url: string) {
      try {
        const text = await (await fetch(url)).text()
        if (!text.match(/slidev/i))
          return false
        // Use semver to compare in the future
        state.compatMode = !text.match(versionRE)
        const detectedEntry = text.match(entryRE)?.[1]
        if (detectedEntry) {
          state.entry = detectedEntry
          logger.info(`[Slidev] Detected Slidev server entry: ${detectedEntry} on port ${port}`)
          if (scannedProjects.value) {
            askAddProject(detectedEntry, `A Slidev server is detected running on localhost:${port}.`)
          }
        }
        return true
      }
      catch (err) {
        state.message = String(err)
      }
      return false
    }

    // We can't use `localhost:` here
    state.ready = await pingUrl(`http://[::1]:${port}`) || await pingUrl(`http://127.0.0.1:${port}`)

    state.pending = null
    resolve(state.ready)
    return state.ready
  }

  const portsToDetect = computed(() => {
    const ports = new Set([config.port])
    for (const project of projects.values()) {
      if (project.port.value)
        ports.add(project.port.value)
    }
    return ports
  })

  watch(portsToDetect, (ports, oldPorts) => {
    for (const port of ports) {
      if (!oldPorts?.has(port))
        redetect(port)
    }
  }, { immediate: true })

  const interval = setInterval(() => {
    const activePort = activeProject.value?.port.value
    if (activePort) {
      redetect(activePort)
    }
  }, 4000)
  onScopeDispose(() => clearInterval(interval))

  function getDetected(project: SlidevProject) {
    const port = project.port.value || config.port
    const detected = detectedPorts.get(port)
    if (detected?.entry === project.entry)
      return detected
    for (const state of detectedPorts.values()) {
      if (state.entry === project.entry)
        return state
    }
    return null
  }

  async function allocPort() {
    const usedPorts = [...projects.values()].map(project => project.port.value ?? 0)
    const minPort = Math.max(3029, ...usedPorts) + 1
    return await getPortPlease({
      portRange: [minPort, 4000],
    })
  }

  return {
    redetect,
    getDetected,
    allocPort,
  }
})

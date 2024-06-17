import { basename } from 'node:path'
import type { Ref } from '@vue/runtime-core'
import { toRef } from '@vue/runtime-core'
import { getPort as getPortPlease } from 'get-port-please'
import type { Terminal } from 'vscode'
import type { SlidevProject } from '../projects'
import { useTerminal } from '../views/terminal'
import { useServerDetector } from './useServerDetector'

export type Server = {
  port: Ref<number | null>
  terminal: Ref<Terminal | null>
  start: () => Promise<void>
  showTerminal: () => Promise<void>
  stop: () => void
} & ReturnType<typeof useServerDetector>

const serverMap = new Map<SlidevProject, Server>()

export function useDevServer(project: SlidevProject) {
  const existing = serverMap.get(project)
  if (existing)
    return existing

  const { terminal, isTerminalActive, showTerminal, sendText, closeTerminal } = useTerminal(project)
  const port = toRef(project, 'port')

  async function start() {
    if (isTerminalActive())
      return
    port.value ??= await getPort()
    sendText(`npm exec slidev -- --port ${port.value} ${JSON.stringify(basename(project.entry))}`)
  }

  function stop() {
    closeTerminal()
    port.value = null
  }

  const result: Server = {
    port,
    terminal,
    start,
    showTerminal,
    stop,
    ...useServerDetector(port, project.entry),
  }
  serverMap.set(project, result)
  return result
}

async function getPort() {
  const usedPorts = [...serverMap.values()].map(server => server.port.value ?? 0)
  const minPort = Math.max(3029, ...usedPorts) + 1
  return await getPortPlease({
    portRange: [minPort, 4000],
  })
}

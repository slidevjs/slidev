import type { Ref } from 'reactive-vscode'
import type { Terminal } from 'vscode'
import type { SlidevProject } from '../projects'
import { basename } from 'node:path'
import { getPort as getPortPlease } from 'get-port-please'
import { toRef } from 'reactive-vscode'
import { useServerTerminal } from '../views/serverTerminal'
import { useServerDetector } from './useServerDetector'

export type Server = {
  port: Ref<number | null>
  terminal: Ref<Terminal | null>
  start: () => void
  showTerminal: () => void
  stop: () => void
} & ReturnType<typeof useServerDetector>

const serverMap = new Map<SlidevProject, Server>()

export function useDevServer(project: SlidevProject) {
  const existing = serverMap.get(project)
  if (existing)
    return existing

  const { terminal, getIsActive, show: showTerminal, sendText, close } = useServerTerminal(project)
  const port = toRef(project, 'port')

  async function start() {
    if (getIsActive())
      return
    port.value ??= await getPort()
    sendText(`npm exec slidev -- --port ${port.value} ${JSON.stringify(basename(project.entry))}`)
  }

  function stop() {
    close()
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

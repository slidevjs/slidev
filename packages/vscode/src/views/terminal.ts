// Ported from https://github.com/antfu/vscode-vite/blob/main/src/terminal.ts

import type { Ref } from '@vue/runtime-core'
import { ref, watch } from '@vue/runtime-core'
import type { Terminal } from 'vscode'
import { Uri, window } from 'vscode'
import { extCtx } from '../index'
import type { SlidevProject } from '../projects'
import { getPort } from '../utils/getPort'
import { getSlidesTitle } from '../utils/getSlidesTitle'

interface UseTerminal {
  terminal: Ref<Terminal | undefined>
  startDevServer: () => Promise<void>
  showTerminal: () => Promise<void>
  closeTerminal: () => void
}

const terminalMap = new WeakMap<SlidevProject, UseTerminal>()

export function useTerminal(project: SlidevProject) {
  const existing = terminalMap.get(project)
  if (existing)
    return existing

  const terminal = ref<Terminal>()

  function isTerminalActive() {
    return terminal.value && terminal.value.exitStatus == null
  }

  function ensureTerminal() {
    if (isTerminalActive())
      return

    terminal.value = window.createTerminal({
      name: getSlidesTitle(project.data),
      cwd: project.userRoot,
      iconPath: {
        light: Uri.file(extCtx.value.asAbsolutePath('dist/res/logo-mono.svg')),
        dark: Uri.file(extCtx.value.asAbsolutePath('dist/res/logo-mono-dark.svg')),
      },
      isTransient: true,
    })
  }

  async function startDevServer() {
    const port = project.port ??= await getPort()
    ensureTerminal()
    terminal.value!.sendText(`npm exec slidev -- --port ${port}`)
  }

  async function showTerminal() {
    ensureTerminal()
    terminal.value!.show()
  }

  function closeTerminal() {
    if (isTerminalActive()) {
      terminal.value!.sendText('\x03')
      terminal.value!.dispose()
      terminal.value = undefined
      project.port = null
    }
  }

  watch(project, (project) => {
    if (!project)
      closeTerminal()
  })

  const result = {
    terminal,
    startDevServer,
    showTerminal,
    closeTerminal,
  }
  terminalMap.set(project, result)
  return result
}

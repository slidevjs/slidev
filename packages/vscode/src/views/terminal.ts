// Ported from https://github.com/antfu/vscode-vite/blob/main/src/terminal.ts

import { sleep } from '@antfu/utils'
import { ref } from '@vue/runtime-core'
import type { Terminal } from 'vscode'
import { Uri, window } from 'vscode'
import { extCtx } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'

export const useTerminal = createSingletonComposable(() => {
  const terminal = ref<Terminal>()

  function isTerminalActive() {
    return terminal.value && terminal.value.exitStatus == null
  }

  function ensureTerminal() {
    if (isTerminalActive())
      return

    terminal.value = window.createTerminal({
      name: 'Slidev',
      iconPath: {
        light: Uri.file(extCtx.value.asAbsolutePath('dist/res/logo-mono.svg')),
        dark: Uri.file(extCtx.value.asAbsolutePath('dist/res/logo-mono-dark.svg')),
      },
      isTransient: true,
    })
  }

  function closeTerminal() {
    if (isTerminalActive()) {
      terminal.value!.sendText('\x03')
      terminal.value!.dispose()
      terminal.value = undefined
    }
  }

  function endProcess() {
    if (isTerminalActive())
      terminal.value!.sendText('\x03')
    extCtx.value?.globalState.update('pid', undefined)
  }

  async function executeCommand(cmd: string) {
    ensureTerminal()
    terminal.value!.sendText(cmd)
    await sleep(2000)
    const pid = await terminal.value?.processId
    if (pid)
      extCtx.value?.globalState.update('pid', pid)
  }

  async function showTerminal() {
    ensureTerminal()
    terminal.value!.show()
  }

  return {
    terminal,
    isTerminalActive,
    ensureTerminal,
    closeTerminal,
    endProcess,
    executeCommand,
    showTerminal,
  }
})

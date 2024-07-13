import { createLabsInfo } from '@volar/vscode'
import type { ServerOptions } from '@volar/vscode/node'
import { LanguageClient, TransportKind } from '@volar/vscode/node'
import { computed } from '@vue/reactivity'
import { watch } from '@vue/runtime-core'
import { extensionContext } from 'reactive-vscode'
import { Uri, window } from 'vscode'
import * as serverProtocol from '../language-server/protocol'
import { slidevFiles } from './projects'
import { logger } from './views/logger'

export function useLanguageClient() {
  const serverModule = Uri.joinPath(extensionContext.value!.extensionUri, 'dist', 'language-server.cjs')
  const runOptions = { execArgv: <string[]>[] }
  const debugOptions = { execArgv: ['--nolazy', `--inspect=${6009}`] }
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: TransportKind.ipc,
      options: runOptions,
    },
    debug: {
      module: serverModule.fsPath,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  }

  const documentSelector = computed(() => slidevFiles.value.map(path => ({ language: 'markdown', pattern: path })))

  logger.info('Starting Slidev language server...')
  const client = new LanguageClient(
    'slidev-language-server',
    'Slidev Language Server',
    serverOptions,
    { documentSelector: documentSelector.value },
  )
  async function start() {
    await client.start()
    const labsInfo = createLabsInfo(serverProtocol)
    labsInfo.addLanguageClient(client)
    return labsInfo.extensionExports
  }

  async function restart() {
    await client.stop()
    client.clientOptions.documentSelector = documentSelector.value
    await client.start()
  }

  watch(
    () => slidevFiles.value.join('\n'),
    () => {
      logger.info('Slidev files changed, restarting language server...')
      window.setStatusBarMessage('Restarting Slidev server...', restart())
    },
  )

  return start()
}

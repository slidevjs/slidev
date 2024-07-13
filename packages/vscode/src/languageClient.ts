import { createLabsInfo } from '@volar/vscode'
import type { ServerOptions } from '@volar/vscode/node'
import { LanguageClient, TransportKind } from '@volar/vscode/node'
import { computed, extensionContext, watch } from 'reactive-vscode'
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

  let shouldStop = false
  async function doRestart() {
    if (shouldStop)
      await client.stop()
    client.clientOptions.documentSelector = documentSelector.value
    await client.start()
    shouldStop = true
  }

  let restartPromise: Promise<void> | undefined
  async function restart() {
    await restartPromise
    restartPromise = doRestart()
    await restartPromise
  }

  watch(
    () => slidevFiles.value.join('\n'),
    () => {
      logger.info('Starting language server...')
      window.setStatusBarMessage('Restarting Slidev server...', restart())
    },
  )

  const labsInfo = createLabsInfo(serverProtocol)
  labsInfo.addLanguageClient(client)
  return labsInfo.extensionExports
}

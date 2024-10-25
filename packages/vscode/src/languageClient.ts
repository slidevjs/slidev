import type { ServerOptions } from '@volar/vscode/node'
import { createLabsInfo } from '@volar/vscode'
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

  async function doStart(shouldStop: boolean) {
    if (shouldStop)
      await client.stop()
    client.clientOptions.documentSelector = documentSelector.value
    await client.start()
  }

  let restartPromise: Promise<void> | undefined
  async function start(shouldStop: boolean) {
    await restartPromise
    restartPromise = doStart(shouldStop)
    await restartPromise
  }

  let shouldStop = false
  watch(
    () => slidevFiles.value.join('\n'),
    (files) => {
      if (files.length === 0 && !shouldStop)
        return
      if (shouldStop)
        window.setStatusBarMessage(`Restarting Slidev language server...`, start(true))
      else
        start(false)
      shouldStop = true
    },
  )

  const labsInfo = createLabsInfo(serverProtocol)
  labsInfo.addLanguageClient(client)
  return labsInfo.extensionExports
}

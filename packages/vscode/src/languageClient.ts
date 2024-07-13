import { createLabsInfo } from '@volar/vscode'
import type { LanguageClientOptions, ServerOptions } from '@volar/vscode/node'
import { LanguageClient, TransportKind } from '@volar/vscode/node'
import { watch } from '@vue/runtime-core'
import { Uri } from 'vscode'
import * as serverProtocol from '../language-server/protocol'
import { slidevFiles } from './projects'
import { extCtx } from '.'

export function useLanguageClient() {
  const serverModule = Uri.joinPath(extCtx.value.extensionUri, 'dist', 'language-server.cjs')
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

  const labsInfo = createLabsInfo(serverProtocol)

  watch(
    () => slidevFiles.value.join('\n'),
    (_, __, onCleanup) => {
      if (!slidevFiles.value.length)
        return
      const clientOptions: LanguageClientOptions = {
        // documentSelector: [{ language: 'markdown' }],
        documentSelector: slidevFiles.value.map(path => ({ language: 'markdown', pattern: path })),
      }
      const client = new LanguageClient(
        'slidev-language-server',
        'Slidev Language Server',
        serverOptions,
        clientOptions,
      )
      const startPromise = client.start().then(() => {
        labsInfo.addLanguageClient(client)
      })
      onCleanup(async () => {
        await startPromise
        client.stop()
      })
    },
    { immediate: true },
  )

  return labsInfo.extensionExports
}

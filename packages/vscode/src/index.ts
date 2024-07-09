import { effectScope, shallowRef } from '@vue/runtime-core'
import type { ExtensionContext } from 'vscode'
import { Uri } from 'vscode'
import type { LanguageClientOptions, ServerOptions } from '@volar/vscode/node'
import { LanguageClient, TransportKind } from '@volar/vscode/node'
import { createLabsInfo } from '@volar/vscode'
import * as serverProtocol from '../language-server/protocol'
import { useCommands } from './commands'
import { useGlobalConfigurations } from './configs'
import { activeEntry, useProjects } from './projects'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { useLogger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useSlidesTree } from './views/slidesTree'
import { useProjectsTree } from './views/projectsTree'

const scope = effectScope()

let client: LanguageClient

export const extCtx = shallowRef<ExtensionContext>(undefined!)

export async function activate(ext: ExtensionContext) {
  extCtx.value = ext

  scope.run(() => {
    // states
    useGlobalConfigurations()
    useProjects()

    // commands
    useCommands()

    // views
    useProjectsTree()
    useSlidesTree()
    usePreviewWebview()
    useAnnotations()
    useFoldings()

    const logger = useLogger()
    logger.info('Slidev activated.')
    logger.info(`Entry: ${activeEntry.value}`)
  })

  return await startLanguageServer(ext)
}

async function startLanguageServer(ext: ExtensionContext) {
  const serverModule = Uri.joinPath(ext.extensionUri, 'dist', 'language-server.cjs')
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
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'markdown' }],
  }
  client = new LanguageClient(
    'slidev-language-server',
    'Slidev Language Server',
    serverOptions,
    clientOptions,
  )
  await client.start()

  const labsInfo = createLabsInfo(serverProtocol)
  labsInfo.addLanguageClient(client)
  return labsInfo.extensionExports
}

export async function deactivate() {
  scope.stop()
}

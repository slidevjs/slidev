import { effectScope, shallowRef } from '@vue/runtime-core'
import type { ExtensionContext } from 'vscode'
import { useCommands } from './commands'
import { useGlobalConfigurations } from './configs'
import { activeEntry, useProjects } from './projects'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { useLogger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useSlidesTree } from './views/slidesTree'
import { useProjectsTree } from './views/projectsTree'
import { useLanguageClient } from './languageClient'

const scope = effectScope()

export const extCtx = shallowRef<ExtensionContext>(undefined!)

export async function activate(ext: ExtensionContext) {
  extCtx.value = ext

  return scope.run(() => {
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

    // language server
    const labsInfo = useLanguageClient()

    const logger = useLogger()
    logger.info('Slidev activated.')
    logger.info(`Entry: ${activeEntry.value}`)

    return labsInfo
  })
}

export async function deactivate() {
  scope.stop()
}

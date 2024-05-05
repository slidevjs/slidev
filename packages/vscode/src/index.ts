import { effectScope } from '@vue/runtime-core'
import type { ExtensionContext } from 'vscode'
import { commands } from 'vscode'
import { useCommands } from './commands'
import { useGlobalConfigurations } from './config'
import { activeEntry, useProjects } from './projects'
import { extCtx } from './state'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { useLanguageStatusItems } from './views/languageStatusItems'
import { useLogger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useSlidesTree } from './views/slidesTree'
import { useProjectsTree } from './views/projectsTree'
import { useVscodeContext } from './composables/useVscodeContext'

const scope = effectScope()

export async function activate(ext: ExtensionContext) {
  extCtx.value = ext
  useVscodeContext('slidev-enabled', () => true)

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
    useLanguageStatusItems()
    useAnnotations()
    useFoldings()

    const logger = useLogger()
    logger.info('Slidev activated.')
    logger.info(`Entry: ${activeEntry.value}`)
  })
}

export async function deactivate() {
  scope.stop()
}

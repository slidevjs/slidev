import { effectScope } from '@vue/runtime-core'
import type { ExtensionContext } from 'vscode'
import { commands } from 'vscode'
import { useCommands } from './commands'
import { useGlobalConfigurations } from './config'
import { activeEntry, extCtx, useGlobalStates } from './state'
import { searchEntry } from './utils/searchEntry'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { useLanguageStatusItems } from './views/languageStatusItems'
import { useLogger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useSlidesTree } from './views/slidesTree'

const scope = effectScope()

export async function activate(ext: ExtensionContext) {
  extCtx.value = ext
  activeEntry.value = searchEntry()
  commands.executeCommand('setContext', 'slidev-enabled', true)

  scope.run(() => {
    // states
    useGlobalConfigurations()
    useGlobalStates()

    // commands
    useCommands()

    // views
    useAnnotations()
    useFoldings()
    usePreviewWebview()
    useSlidesTree()
    useLanguageStatusItems()

    const logger = useLogger()
    logger.info('Slidev activated.')
    logger.info(`Entry: ${activeEntry.value}`)
  })
}

export async function deactivate() {
  scope.stop()
}

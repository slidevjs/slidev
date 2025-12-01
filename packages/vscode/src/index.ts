import { defineExtension } from 'reactive-vscode'
import { useCommands } from './commands'
import { useLanguageClient } from './languageClient'
import { useLmTools } from './lmTools'
import { activeEntry, useProjects } from './projects'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { logger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useProjectsTree } from './views/projectsTree'
import { useSlidesTree } from './views/slidesTree'

const { activate, deactivate } = defineExtension(() => {
  // states
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

  // language model tools. Wrap in try-catch for older vscode versions that do not support it.
  try {
    useLmTools()
  }
  catch (e) {
    logger.warn(`Failed to initialize language model tools: ${e}`)
  }

  logger.info('Slidev activated.')
  logger.info(`Entry: ${activeEntry.value}`)

  return labsInfo
})

export { activate, deactivate }

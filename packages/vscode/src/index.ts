import { defineExtension } from 'reactive-vscode'
import { useCommands } from './commands'
import { activeEntry, useProjects } from './projects'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { logger } from './views/logger'
import { usePreviewWebview } from './views/previewWebview'
import { useSlidesTree } from './views/slidesTree'
import { useProjectsTree } from './views/projectsTree'
import { useLanguageClient } from './languageClient'

// eslint-disable-next-line no-restricted-syntax
export = defineExtension(() => {
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

  logger.info('Slidev activated.')
  logger.info(`Entry: ${activeEntry.value}`)

  return labsInfo
})

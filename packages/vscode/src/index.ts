import { defineExtension } from 'reactive-vscode'
import { useCommands } from './commands'
import { useLanguageClient } from './languageClient'
import { activeEntry, useProjects } from './projects'
import { useAnnotations } from './views/annotations'
import { useFoldings } from './views/foldings'
import { logger } from './views/logger'
import { useMcpTreeView } from './views/mcpTreeView'
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
  useMcpTreeView()

  // language server
  const labsInfo = useLanguageClient()

  logger.info('Slidev activated.')
  logger.info(`Entry: ${activeEntry.value}`)

  return labsInfo
})

export { activate, deactivate }

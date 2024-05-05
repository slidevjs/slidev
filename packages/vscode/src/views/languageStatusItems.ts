import path from 'node:path'
import { onScopeDispose, watchEffect } from '@vue/runtime-core'
import { languages } from 'vscode'
import { previewPort, workspaceRoot } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { activeEntry } from '../projects'

export const useLanguageStatusItems = createSingletonComposable(() => {
  // const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 10)

  // TODO: Select by doc paths
  const selector = {
    language: 'markdown',
  }

  const entryStatus = languages.createLanguageStatusItem('slidev.entry', selector)
  const portStatus = languages.createLanguageStatusItem('slidev.port', selector)

  watchEffect(() => {
    entryStatus.name = entryStatus.detail = 'Slides entry'
    entryStatus.text = activeEntry.value ? path.relative(workspaceRoot, activeEntry.value) : 'Not found'

    portStatus.name = portStatus.detail = 'Preview port'
    portStatus.text = previewPort.value.toString()
    portStatus.command = {
      title: 'Configure Port',
      command: 'slidev.config-port',
      tooltip: 'Configure the preview port',
    }
  })

  onScopeDispose(() => {
    entryStatus.dispose()
    portStatus.dispose()
  })

  return {
    entryStatus,
    portStatus,
  }
})

import { relative } from 'node:path'
import { slash } from '@antfu/utils'
import { useCommand } from 'reactive-vscode'
import { ConfigurationTarget, window, workspace } from 'vscode'
import { useDevServer } from './composables/useDevServer'
import { useFocusedSlide } from './composables/useFocusedSlide'
import { configuredPort, forceEnabled, include, previewSync } from './configs'
import { activeEntry, activeProject, addProject, projects, rescanProjects } from './projects'
import { findPossibleEntries } from './utils/findPossibleEntries'
import { getSlidesTitle } from './utils/getSlidesTitle'
import { usePreviewWebview } from './views/previewWebview'

export function useCommands() {
  useCommand('slidev.enable-extension', () => forceEnabled.value = true)
  useCommand('slidev.disable-extension', () => forceEnabled.value = false)

  useCommand('slidev.rescan-projects', rescanProjects)

  useCommand('slidev.choose-entry', async () => {
    const entry = await window.showQuickPick([...projects.keys()], {
      title: 'Choose active slides entry.',
    })
    if (entry)
      activeEntry.value = entry
  })

  useCommand('slidev.add-entry', async () => {
    const files = await findPossibleEntries()
    const selected = await window.showQuickPick(files, {
      title: 'Choose Markdown files to add as slides entries.',
      canPickMany: true,
    })
    if (selected) {
      for (const entry of selected)
        addProject(entry)
      if (workspace.workspaceFolders) {
        const workspaceRoot = workspace.workspaceFolders[0].uri.fsPath
        const relatives = selected.map(s => slash(relative(workspaceRoot, s)))
        // write back to settings.json
        include.update([...include.value, ...relatives])
      }
    }
  })

  useCommand('slidev.remove-entry', async (node: any) => {
    const entry = slash(node.treeItem.resourceUri.fsPath)
    if (activeEntry.value === entry)
      activeEntry.value = null
    projects.delete(entry)
  })

  useCommand('slidev.set-as-active', async (node: any) => {
    const entry = slash(node.treeItem.resourceUri.fsPath)
    activeEntry.value = entry
  })

  useCommand('slidev.stop-dev', async (node: any) => {
    const entry = node ? slash(node.treeItem.resourceUri.fsPath) : activeEntry.value
    if (!entry)
      return
    const project = projects.get(entry)
    project?.server.value?.scope.stop()
  })

  useCommand('slidev.goto', (filepath: string, index: number) => {
    const { gotoSlide } = useFocusedSlide()
    gotoSlide(filepath, index)
  })
  useCommand('slidev.next', () => {
    const { focusedMarkdown, focusedSourceSlide, gotoSlide } = useFocusedSlide()
    if (!focusedMarkdown.value || focusedSourceSlide.value == null)
      return
    gotoSlide(focusedMarkdown.value!.filepath, focusedSourceSlide.value.index + 1)
  })
  useCommand('slidev.prev', () => {
    const { focusedMarkdown, focusedSourceSlide, gotoSlide } = useFocusedSlide()
    if (!focusedMarkdown.value || focusedSourceSlide.value == null)
      return
    gotoSlide(focusedMarkdown.value!.filepath, focusedSourceSlide.value.index - 1)
  })

  useCommand('slidev.refresh-preview', () => {
    const { refresh } = usePreviewWebview()
    refresh()
  })

  useCommand('slidev.config-port', async () => {
    if (!activeProject.value) {
      window.showErrorMessage('No active project to configure port.')
      return
    }
    const port = await window.showInputBox({
      prompt: `Slidev Preview Port for ${getSlidesTitle(activeProject.value.data)}`,
      value: configuredPort.value.toString(),
      validateInput: (v) => {
        if (!v.match(/^\d+$/))
          return 'Port should be a number'
        if (+v < 1024 || +v > 65535)
          return 'Port should be between 1024 and 65535'
        return null
      },
    })
    if (port && activeProject.value) {
      activeProject.value.port.value = +port
    }
  })

  useCommand('slidev.start-dev', async () => {
    const project = activeProject.value
    if (!project) {
      window.showErrorMessage('Cannot start dev server: No active slides project.')
      return
    }

    const { start, showTerminal } = useDevServer(project)
    start()
    showTerminal()

    const { retry } = usePreviewWebview()
    setTimeout(retry, 3000)
    setTimeout(retry, 5000)
    setTimeout(retry, 7000)
    setTimeout(retry, 9000)
  })

  useCommand('slidev.open-in-browser', () => usePreviewWebview().openExternal())

  useCommand('slidev.preview-prev-click', () => usePreviewWebview().prevClick())
  useCommand('slidev.preview-next-click', () => usePreviewWebview().nextClick())
  useCommand('slidev.preview-prev-slide', () => usePreviewWebview().prevSlide())
  useCommand('slidev.preview-next-slide', () => usePreviewWebview().nextSlide())

  useCommand('slidev.enable-preview-sync', () => (previewSync.update(true, ConfigurationTarget.Global)))
  useCommand('slidev.disable-preview-sync', () => (previewSync.update(false, ConfigurationTarget.Global)))
}

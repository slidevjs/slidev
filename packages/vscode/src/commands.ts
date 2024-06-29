import { relative } from 'node:path'
import { onScopeDispose } from '@vue/runtime-core'
import type { Disposable } from 'vscode'
import { Position, Range, Selection, TextEditorRevealType, Uri, commands, window, workspace } from 'vscode'
import { save as saveSlidevMarkdown } from '@slidev/parser/fs'
import { slash } from '@antfu/utils'
import { useDevServer } from './composables/useDevServer'
import { useEditingSlideSource } from './composables/useEditingSlideSource'
import { useFocusedSlideNo } from './composables/useFocusedSlideNo'
import { configuredPort, forceEnabled, include, previewSync } from './configs'
import type { SlidevProject } from './projects'
import { activeEntry, activeProject, activeSlidevData, addProject, projects, rescanProjects } from './projects'
import { findPossibleEntries } from './utils/findPossibleEntries'
import { usePreviewWebview } from './views/previewWebview'
import type { SlidesTreeElement } from './views/slidesTree'

export function useCommands() {
  const disposables: Disposable[] = []
  onScopeDispose(() => disposables.forEach(d => d.dispose()))
  function registerCommand(command: string, callback: (...args: any[]) => any) {
    disposables.push(commands.registerCommand(command, callback))
  }

  registerCommand('slidev.enable-extension', () => forceEnabled.value = true)
  registerCommand('slidev.disable-extension', () => forceEnabled.value = false)

  registerCommand('slidev.rescan-projects', rescanProjects)

  registerCommand('slidev.choose-entry', async () => {
    const entry = await window.showQuickPick([...projects.keys()], {
      title: 'Choose active slides entry.',
    })
    if (entry)
      activeEntry.value = entry
  })

  registerCommand('slidev.add-entry', async () => {
    const files = await findPossibleEntries()
    const selected = await window.showQuickPick(files, {
      title: 'Choose Markdown files to add as slides entries.',
      canPickMany: true,
    })
    if (selected) {
      for (const entry of selected)
        await addProject(entry)
      if (workspace.workspaceFolders) {
        const workspaceRoot = workspace.workspaceFolders[0].uri.fsPath
        const relatives = selected.map(s => slash(relative(workspaceRoot, s)))
        include.value = [...include.value, ...relatives]
      }
    }
  })

  registerCommand('slidev.remove-entry', async (project: SlidevProject) => {
    const entry = project.entry
    if (activeEntry.value === entry)
      activeEntry.value = null
    projects.delete(entry)
  })

  registerCommand('slidev.set-as-active', async (project: SlidevProject) => {
    activeEntry.value = project.entry
  })

  registerCommand('slidev.stop-dev', async (project: SlidevProject) => {
    const { stop } = useDevServer(project)
    stop()
  })

  async function gotoSlide(filepath: string, index: number, getNo?: () => number | null) {
    const { markdown: currrentMarkdown, index: currentIndex } = useEditingSlideSource()
    const sameFile = currrentMarkdown.value?.filepath === filepath
    if (sameFile && currentIndex.value === index)
      return

    const slide = activeSlidevData.value?.markdownFiles[filepath]?.slides[index]
    if (!slide)
      return

    const uri = Uri.file(filepath).with({
      // Add a fragment to the URI will cause a flush. So we need to remove it if it's the same file.
      fragment: sameFile ? undefined : `L${slide.contentStart + 1}`,
    })
    const editor = await window.showTextDocument(await workspace.openTextDocument(uri))

    const cursorPos = new Position(slide.contentStart, 0)
    editor.selection = new Selection(cursorPos, cursorPos)

    const startPos = new Position(slide.start, 0)
    const endPos = new Position(slide.end, 0)
    const slideRange = new Range(startPos, endPos)
    editor.revealRange(slideRange, TextEditorRevealType.AtTop)

    const no = getNo?.()
    if (no) {
      const focusedSlideNo = useFocusedSlideNo()
      focusedSlideNo.value = no
    }
  }

  registerCommand('slidev.goto', gotoSlide)
  registerCommand('slidev.next', () => {
    const { markdown, index } = useEditingSlideSource()
    const focusedSlideNo = useFocusedSlideNo()
    gotoSlide(markdown.value!.filepath, index.value + 1, () => focusedSlideNo.value + 1)
  })
  registerCommand('slidev.prev', () => {
    const { markdown, index } = useEditingSlideSource()
    const focusedSlideNo = useFocusedSlideNo()
    gotoSlide(markdown.value!.filepath, index.value - 1, () => focusedSlideNo.value - 1)
  })

  registerCommand('slidev.refresh-preview', () => {
    const { refresh } = usePreviewWebview()
    refresh()
  })

  registerCommand('slidev.config-port', async () => {
    const port = await window.showInputBox({
      prompt: 'Slidev Preview Port',
      value: configuredPort.value.toString(),
      validateInput: (v) => {
        if (!v.match(/^\d+$/))
          return 'Port should be a number'
        if (+v < 1024 || +v > 65535)
          return 'Port should be between 1024 and 65535'
        return null
      },
    })
    if (!port)
      return
    configuredPort.value = +port
  })

  registerCommand('slidev.start-dev', async () => {
    const project = activeProject.value
    if (!project) {
      window.showErrorMessage('Cannot start dev server: No active slides project.')
      return
    }

    const { start, showTerminal } = useDevServer(project)
    await start()
    await showTerminal()

    const { retry } = usePreviewWebview()
    setTimeout(retry, 3000)
    setTimeout(retry, 5000)
    setTimeout(retry, 7000)
    setTimeout(retry, 9000)
  })

  registerCommand('slidev.open-in-browser', () => usePreviewWebview().openExternal())

  registerCommand('slidev.preview-prev-click', () => usePreviewWebview().prevClick())
  registerCommand('slidev.preview-next-click', () => usePreviewWebview().nextClick())
  registerCommand('slidev.preview-prev-slide', () => usePreviewWebview().prevSlide())
  registerCommand('slidev.preview-next-slide', () => usePreviewWebview().nextSlide())

  registerCommand('slidev.enable-preview-sync', () => (previewSync.value = true))
  registerCommand('slidev.disable-preview-sync', () => (previewSync.value = false))

  registerCommand('slidev.remove-slide', ({ slide }: SlidesTreeElement) => {
    const md = activeSlidevData.value!.markdownFiles[slide.filepath]
    md.slides.splice(md.slides.indexOf(slide), 1)
    saveSlidevMarkdown(md)
  })
}

import { move } from '@antfu/utils'
import { save as slidevSave } from '@slidev/parser/fs'
import type { SourceSlideInfo } from '@slidev/types'
import { onScopeDispose } from '@vue/runtime-core'
import type { Disposable } from 'vscode'
import { Position, Range, Selection, TextEditorRevealType, Uri, commands, window, workspace } from 'vscode'
import { useEditingSlideSource } from './composables/useEditingSlideSource'
import { useFocusedSlideNo } from './composables/useFocusedSlideNo'
import { configuredPort, previewSync } from './config'
import type { SlidevProject } from './projects'
import { activeEntry, activeProject, activeSlidevData, addProject, projects } from './projects'
import { findPossibleEntries } from './utils/findPossibleEntries'
import { usePreviewWebview } from './views/previewWebview'
import { useTerminal } from './views/terminal'

export function useCommands() {
  const disposables: Disposable[] = []
  onScopeDispose(() => disposables.forEach(d => d.dispose()))
  function registerCommand(command: string, callback: (...args: any[]) => any) {
    disposables.push(commands.registerCommand(command, callback))
  }

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
    }
  })

  registerCommand('slidev.set-as-active', async (project: SlidevProject) => {
    activeEntry.value = project.entry
  })

  registerCommand('slidev.stop-dev', async (project: SlidevProject) => {
    useTerminal(project).closeTerminal()
    setTimeout(() => usePreviewWebview().refresh(false), 100)
  })

  async function gotoSlide(filepath: string, index: number, getNo?: () => number | null) {
    const { markdown: currrentMarkdown, index: currentIndex } = useEditingSlideSource()
    if (currrentMarkdown.value?.filepath === filepath && currentIndex.value === index)
      return

    const slide = activeSlidevData.value?.markdownFiles[filepath]?.slides[index]
    if (!slide)
      return

    const editor = await window.showTextDocument(await workspace.openTextDocument(Uri.file(filepath)))

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

  registerCommand('slidev.move-up', async ({ filepath, index }: SourceSlideInfo) => {
    const md = activeSlidevData.value?.markdownFiles[filepath]
    if (!md || index <= 0)
      return
    move(md.slides, index, index - 1)
    slidevSave(md)
  })
  registerCommand('slidev.move-down', async ({ filepath, index }: SourceSlideInfo) => {
    const md = activeSlidevData.value?.markdownFiles[filepath]
    if (!md || index >= md.slides.length - 1)
      return
    move(md.slides, index, index + 1)
    slidevSave(md)
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

    const { startDevServer, showTerminal } = useTerminal(project)
    await startDevServer()
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
}

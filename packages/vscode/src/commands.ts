import { save as saveSlidevMarkdown } from '@slidev/parser/fs'
import { useCommand } from 'reactive-vscode'
import { Position, Range, Selection, TextEditorRevealType, Uri, window, workspace } from 'vscode'
import { useDevServer } from './composables/useDevServer'
import { useEditingSlideSource } from './composables/useEditingSlideSource'
import { useFocusedSlideNo } from './composables/useFocusedSlideNo'
import { configuredPort, forceEnabled, previewSync } from './configs'
import type { SlidevProject } from './projects'
import { activeEntry, activeProject, activeSlidevData, addProject, projects, rescanProjects } from './projects'
import { findPossibleEntries } from './utils/findPossibleEntries'
import { usePreviewWebview } from './views/previewWebview'
import type { SlidesTreeNode } from './views/slidesTree'

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
        await addProject(entry)
    }
  })

  useCommand('slidev.remove-entry', async (project: SlidevProject) => {
    const entry = project.entry
    if (activeEntry.value === entry)
      activeEntry.value = null
    projects.delete(entry)
  })

  useCommand('slidev.set-as-active', async (project: SlidevProject) => {
    activeEntry.value = project.entry
  })

  useCommand('slidev.stop-dev', async (project: SlidevProject) => {
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

  useCommand('slidev.goto', gotoSlide)
  useCommand('slidev.next', () => {
    const { markdown, index } = useEditingSlideSource()
    const focusedSlideNo = useFocusedSlideNo()
    gotoSlide(markdown.value!.filepath, index.value + 1, () => focusedSlideNo.value + 1)
  })
  useCommand('slidev.prev', () => {
    const { markdown, index } = useEditingSlideSource()
    const focusedSlideNo = useFocusedSlideNo()
    gotoSlide(markdown.value!.filepath, index.value - 1, () => focusedSlideNo.value - 1)
  })

  useCommand('slidev.refresh-preview', () => {
    const { refresh } = usePreviewWebview()
    refresh()
  })

  useCommand('slidev.config-port', async () => {
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

  useCommand('slidev.start-dev', async () => {
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

  useCommand('slidev.open-in-browser', () => usePreviewWebview().openExternal())

  useCommand('slidev.preview-prev-click', () => usePreviewWebview().prevClick())
  useCommand('slidev.preview-next-click', () => usePreviewWebview().nextClick())
  useCommand('slidev.preview-prev-slide', () => usePreviewWebview().prevSlide())
  useCommand('slidev.preview-next-slide', () => usePreviewWebview().nextSlide())

  useCommand('slidev.enable-preview-sync', () => (previewSync.value = true))
  useCommand('slidev.disable-preview-sync', () => (previewSync.value = false))

  useCommand('slidev.remove-slide', async ({ slide }: SlidesTreeNode) => {
    const md = activeSlidevData.value!.markdownFiles[slide.filepath]
    md.slides.splice(md.slides.indexOf(slide), 1)
    await saveSlidevMarkdown(md)
  })
}

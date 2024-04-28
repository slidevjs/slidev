import { move } from '@antfu/utils'
import { save as slidevSave } from '@slidev/parser/fs'
import type { SlideInfo } from '@slidev/types'
import { onScopeDispose } from '@vue/runtime-core'
import type { Disposable } from 'vscode'
import { Position, Range, Selection, TextEditorRevealType, commands, window } from 'vscode'
import { useActiveTextEditor } from './composables/useActiveTextEditor'
import { useEditingSlideSource } from './composables/useEditingSlideSource'
import { useMarkdownFromDoc } from './composables/useMarkdownFromDoc'
import { configuredPort } from './config'
import { activeSlidevData } from './state'
import { usePreviewWebview } from './views/previewWebview'

export function useCommands() {
  const disposables: Disposable[] = []
  function registerCommand(command: string, callback: (...args: any[]) => any) {
    disposables.push(commands.registerCommand(command, callback))
  }

  const activeEditor = useActiveTextEditor()
  const activeMd = useMarkdownFromDoc(() => activeEditor.value?.document)

  async function gotoSlide(index: number) {
    const editor = activeEditor.value
    const slide = activeMd.value?.slides[index]
    if (!editor || !slide)
      return

    const pos = new Position(slide.start || 0, 0)
    const range = new Range(pos, pos)
    editor.selection = new Selection(pos, pos)
    editor.revealRange(range, TextEditorRevealType.AtTop)
  }

  const editingSlideIndex = useEditingSlideSource().index

  registerCommand('slidev.goto', gotoSlide)
  registerCommand('slidev.next', () => gotoSlide(editingSlideIndex.value + 1))
  registerCommand('slidev.prev', () => gotoSlide(editingSlideIndex.value - 1))

  registerCommand('slidev.move-up', async (slide: SlideInfo) => {
    const { index, filepath } = slide.source
    const data = activeSlidevData.value
    const md = data?.markdownFiles[filepath]
    if (!md || index <= 0)
      return
    move(md.slides, index, index - 1)
    slidevSave(md)
  })
  registerCommand('slidev.move-down', async (slide: SlideInfo) => {
    const { index, filepath } = slide.source
    const data = activeSlidevData.value
    const md = data?.markdownFiles[filepath]
    if (!md || index >= data.slides.length - 1)
      return
    move(md.slides, index, index + 1)
    slidevSave(md)
  })

  const { refresh } = usePreviewWebview()
  registerCommand('slidev.preview-refresh', refresh)

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

  onScopeDispose(() => disposables.forEach(d => d.dispose()))
}

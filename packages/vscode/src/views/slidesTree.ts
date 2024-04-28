import { save as slidevSave } from '@slidev/parser/fs'
import type { SlideInfo, SourceSlideInfo } from '@slidev/types'
import { onScopeDispose, watch } from '@vue/runtime-core'
import type { TreeItem } from 'vscode'
import { DataTransferItem, EventEmitter, window } from 'vscode'
import { activeSlidevData, extCtx } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'

export const slideMineType = 'application/slidev.slide'

const layoutIconMap = Object.fromEntries([
  ['cover', 'carbon-home'],
  ['section', 'carbon-align-box-middle-left'],
  ['center', 'carbon-align-box-middle-center'],
  ['centered', 'carbon-align-box-middle-center'],
  ['image', 'carbon-image'],
  ['image-left', 'carbon-open-panel-filled-left'],
  ['image-right', 'carbon-open-panel-filled-right'],
  ['intro', 'carbon-identification'],
])

function getTreeItem(info: SlideInfo): TreeItem {
  const layoutName = info.frontmatter.layout || (info.index === 0 ? 'cover' : 'default')
  const iconName = layoutIconMap[layoutName]
  return {
    label: `${info.index + 1} - ${info.title || ''}`,
    description: !info.title ? '(Untitled)' : undefined,
    iconPath: iconName ? extCtx.value.asAbsolutePath(`dist/res/icons/${iconName}.svg`) : undefined,
    command: {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [info.source.filepath, info.source.index],
    },
  }
}

export const useSlidesTree = createSingletonComposable(() => {
  const onChange = new EventEmitter<void>()

  const treeView = window.createTreeView('slidev-slides', {
    treeDataProvider: {
      onDidChangeTreeData: onChange.event,
      getTreeItem,
      getChildren(element) {
        if (!element)
          return activeSlidevData.value?.slides
      },
    },
    canSelectMany: true,
    dragAndDropController: {
      dragMimeTypes: [slideMineType],
      dropMimeTypes: [slideMineType],
      handleDrag(slides, dataTransfer) {
        dataTransfer.set(slideMineType, new DataTransferItem(slides))
      },
      handleDrop(target, dataTransfer) {
        const slides: SlideInfo[] = dataTransfer.get(slideMineType)?.value
        if (!slides || !target)
          return
        const data = activeSlidevData.value
        if (!data) {
          window.showErrorMessage(`Cannot drag and drop slides: No active slides project.`)
          return
        }
        const sourcesInEntry = slides.map(s => s.importChain?.[0] ?? s.source)
        const targetIndex = (target.importChain?.[0] ?? target.source).index
        const oldSlides = data.entry.slides.map(s => sourcesInEntry.includes(s) ? null : s)
        data.entry.slides = [
          ...oldSlides.slice(0, targetIndex + 1),
          ...sourcesInEntry,
          ...oldSlides.slice(targetIndex + 1),
        ].filter(Boolean) as SourceSlideInfo[]
        slidevSave(data.entry)
      },
    },
    showCollapseAll: true,
  })
  onScopeDispose(() => treeView.dispose())

  watch(activeSlidevData, () => onChange.fire())

  return treeView
})

import type { SourceSlideInfo } from '@slidev/types'
import { onScopeDispose, watch } from '@vue/runtime-core'
import type { TreeItem } from 'vscode'
import { DataTransferItem, EventEmitter, ThemeIcon, TreeItemCollapsibleState, window } from 'vscode'
import { save as slidevSave } from '@slidev/parser/fs'
import { activeSlidevData, extCtx } from '../state'
import { createSingletonComposable } from '../utils/singletonComposable'
import { toRelativePath } from '../utils/toRelativePath'
import { getSlideNo } from '../utils/getSlideNo'

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

function getTreeItem(element: SourceSlideInfo[]): TreeItem {
  const slide = element.at(-1)!
  const isFirstSlide = activeSlidevData.value?.entry.slides.findIndex(s => s === slide) === 0
  const layoutName = slide.frontmatter.layout || (isFirstSlide ? 'cover' : 'default')
  const resIconName = layoutIconMap[layoutName] ?? ''
  const resIconPath = resIconName ? extCtx.value.asAbsolutePath(`dist/res/icons/${resIconName}.svg`) : undefined
  return {
    label: slide.title,
    description: slide.imports ? toRelativePath(slide.imports[0].filepath) : !slide.title ? '(Untitled)' : undefined,
    iconPath: slide.imports ? undefined : resIconPath ?? new ThemeIcon('window'),
    command: {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [slide.filepath, slide.index, () => getSlideNo(slide, element.slice(0, -1))],
    },
    collapsibleState: slide.imports ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None,
  }
}

export const useSlidesTree = createSingletonComposable(() => {
  const onChange = new EventEmitter<void>()

  const treeView = window.createTreeView('slidev-slides-tree', {
    treeDataProvider: {
      onDidChangeTreeData: onChange.event,
      getTreeItem,
      getChildren(element) {
        return element
          ? element.at(-1)!.imports?.map(s => element.concat(s))
          : activeSlidevData.value?.entry.slides.map(s => [s])
      },
    },
    canSelectMany: true,
    dragAndDropController: {
      dragMimeTypes: [slideMineType],
      dropMimeTypes: [slideMineType],
      handleDrag(elements, dataTransfer) {
        const data = activeSlidevData.value
        if (!data) {
          window.showErrorMessage(`Cannot drag and drop slides: No active slides project.`)
          return
        }
        const sourcesInEntry = elements.filter(s => s.at(-1)!.filepath === data.entry.filepath)
        if (sourcesInEntry.length === 0) {
          window.showErrorMessage(`Cannot drag and drop slides: None of the selected slides are in the entry Markdown.`)
          return
        }
        dataTransfer.set(slideMineType, new DataTransferItem(sourcesInEntry))
      },
      handleDrop(target, dataTransfer) {
        const slides: SourceSlideInfo[] = dataTransfer.get(slideMineType)?.value
        if (!slides || !target)
          return
        const data = activeSlidevData.value
        if (!data)
          return
        const targetIndex = target.at(-1)!.index
        const oldSlides = data.entry.slides.map(s => slides.includes(s) ? null : s)
        data.entry.slides = [
          ...oldSlides.slice(0, targetIndex + 1),
          ...slides,
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

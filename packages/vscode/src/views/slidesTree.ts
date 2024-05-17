import { save as slidevSave } from '@slidev/parser/fs'
import type { SourceSlideInfo } from '@slidev/types'
import { computed, markRaw, onScopeDispose, watch, watchEffect } from '@vue/runtime-core'
import type { TreeItem } from 'vscode'
import { DataTransferItem, EventEmitter, ThemeIcon, TreeItemCollapsibleState, commands, window } from 'vscode'
import { useViewVisibility } from '../composables/useViewVisibility'
import { previewSync } from '../configs'
import { activeSlidevData } from '../projects'
import { getSlideNo } from '../utils/getSlideNo'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { createSingletonComposable } from '../utils/singletonComposable'
import { toRelativePath } from '../utils/toRelativePath'
import { usePreviewWebview } from './previewWebview'

export const slideMineType = 'application/slidev.slide'

const layoutIconMap = {
  'center': 'symbol-constant', // TODO: a better icon
  'cover': 'home',
  'default': 'window',
  'end': 'primitive-square',
  'fact': 'comment',
  'full': 'screen-full',
  'iframe-left': 'layout-sidebar-left',
  'iframe-right': 'layout-sidebar-right',
  'iframe': 'globe',
  'image-left': 'layout-sidebar-left',
  'image-right': 'layout-sidebar-right',
  'image': 'file-media', // TODO: a better icon
  'intro': 'go-to-file',
  'none': 'layout-statusbar',
  'quote': 'quote',
  'section': 'symbol-module', // TODO: a better icon
  'statement': 'megaphone',
  'two-cols-header': 'symbol-struct',
  'two-cols': 'split-horizontal',
} as Record<string, string>

export interface SlidesTreeElement {
  parent: SlidesTreeElement | null
  children?: SlidesTreeElement[]
  slide: SourceSlideInfo
}

function getImportChain(element: SlidesTreeElement): SourceSlideInfo[] {
  const chain: SourceSlideInfo[] = []
  let parent = element.parent
  while (parent) {
    chain.unshift(parent.slide)
    parent = parent.parent
  }
  return chain
}

function getGotoCommandArgs(element: SlidesTreeElement) {
  const slide = element.slide
  return [
    slide.filepath,
    slide.index,
    () => getSlideNo(activeSlidevData.value, slide, getImportChain(element)),
  ]
}

function getTreeItem(element: SlidesTreeElement): TreeItem {
  const slide = element.slide
  const isFirstSlide = activeSlidevData.value?.entry.slides.findIndex(s => s === slide) === 0
  const layoutName = slide.frontmatter.layout || (isFirstSlide ? 'cover' : 'default')
  const icon = slide.imports ? 'link-external' : layoutIconMap[layoutName] ?? 'window'
  return {
    label: slide.title,
    description: slide.imports ? toRelativePath(slide.imports[0].filepath) : !slide.title ? '(Untitled)' : undefined,
    iconPath: new ThemeIcon(icon),
    command: {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: getGotoCommandArgs(element),
    },
    collapsibleState: slide.imports ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None,
  }
}

export const useSlidesTree = createSingletonComposable(() => {
  const onChange = new EventEmitter<void>()

  const slidesTreeData = computed(() => {
    function createElement(parent: SlidesTreeElement | null, slide: SourceSlideInfo) {
      const element: SlidesTreeElement = markRaw({ parent, slide })
      element.children = slide.imports?.map(s => createElement(element, s))
      return element
    }
    return activeSlidevData.value?.entry.slides.map(s => createElement(null, s))
  })

  const treeView = window.createTreeView('slidev-slides-tree', {
    treeDataProvider: {
      onDidChangeTreeData: onChange.event,
      getTreeItem,
      getChildren(element) {
        return element
          ? element.children
          : slidesTreeData.value
      },
      getParent(element) {
        return element.parent
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
        const sourcesInEntry = elements.map(element => element.slide).filter(s => s.filepath === data.entry.filepath)
        dataTransfer.set(slideMineType, new DataTransferItem(sourcesInEntry))
      },
      handleDrop(target, dataTransfer) {
        const slides: SourceSlideInfo[] = dataTransfer.get(slideMineType)?.value
        if (!slides || !target)
          return
        if (slides.length === 0) {
          window.showErrorMessage(`Cannot drag and drop slides: None of the selected slides are in the entry Markdown.`)
          return
        }
        const data = activeSlidevData.value!
        const targetIndex = target.slide.index
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

  const visible = useViewVisibility(treeView)
  const { previewNavState } = usePreviewWebview()
  watch(
    () => [visible.value, previewNavState.no, activeSlidevData.value, slidesTreeData.value] as const,
    ([visible, no, data, tree]) => {
      if (!visible)
        return
      const slide = data?.slides[no - 1]
      if (!slide || !previewSync.value)
        return
      const path = (slide.importChain ?? []).concat(slide.source)
      const source = path.shift()
      let element = tree?.find(e => e.slide === source)
      while (true) {
        const source = path.shift()
        if (!source) {
          if (element) {
            treeView.reveal(element, { select: true })
            commands.executeCommand('slidev.goto', ...getGotoCommandArgs(element))
          }
          return
        }
        element = element?.children?.find(e => e.slide === source)
        if (!element)
          return
      }
    },
  )

  watchEffect(() => {
    if (activeSlidevData.value)
      treeView.title = `Slides (${getSlidesTitle(activeSlidevData.value)})`
    else
      treeView.title = 'Slides'
  })

  return treeView
})

import type { SourceSlideInfo } from '@slidev/types'
import type { TreeViewNode } from 'reactive-vscode'
import type { TreeItem } from 'vscode'
import { save as slidevSave } from '@slidev/parser/fs'
import { computed, createSingletonComposable, useTreeView, useViewVisibility, watch } from 'reactive-vscode'
import { commands, DataTransferItem, ThemeIcon, TreeItemCollapsibleState, window } from 'vscode'
import { previewSync } from '../configs'
import { activeSlidevData } from '../projects'
import { getSlideNo } from '../utils/getSlideNo'
import { getSlidesTitle } from '../utils/getSlidesTitle'
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

export interface SlidesTreeNode {
  parent: SlidesTreeNode | null
  slide: SourceSlideInfo
}

function getImportChain(node: SlidesTreeNode): SourceSlideInfo[] {
  const chain: SourceSlideInfo[] = []
  let parent = node.parent
  while (parent) {
    chain.unshift(parent.slide)
    parent = parent.parent
  }
  return chain
}

function getGotoCommandArgs(node: SlidesTreeNode) {
  const slide = node.slide
  return [
    slide.filepath,
    slide.index,
    () => getSlideNo(activeSlidevData.value, slide, getImportChain(node)),
  ]
}

function getTreeItem(node: SlidesTreeNode): TreeItem {
  const slide = node.slide
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
      arguments: getGotoCommandArgs(node),
    },
    collapsibleState: slide.imports ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None,
  }
}

export const useSlidesTree = createSingletonComposable(() => {
  const slidesTreeData = computed(() => {
    function createNode(parent: SlidesTreeNode | null, slide: SourceSlideInfo): TreeViewNode & SlidesTreeNode {
      const node: SlidesTreeNode = { parent, slide }
      return {
        ...node,
        children: slide.imports?.map(s => createNode(node, s)),
        treeItem: getTreeItem(node),
      }
    }
    return activeSlidevData.value?.entry.slides.map(s => createNode(null, s)) ?? []
  })

  const treeView = useTreeView('slidev-slides-tree', slidesTreeData, {
    canSelectMany: true,
    dragAndDropController: {
      dragMimeTypes: [slideMineType],
      dropMimeTypes: [slideMineType],
      handleDrag(source, dataTransfer) {
        const data = activeSlidevData.value
        if (!data) {
          window.showErrorMessage(`Cannot drag and drop slides: No active slides project.`)
          return
        }
        const sourcesInEntry = source.map(node => node.slide).filter(s => s.filepath === data.entry.filepath)
        dataTransfer.set(slideMineType, new DataTransferItem(sourcesInEntry))
      },
      async handleDrop(target, dataTransfer) {
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
        await slidevSave(data.entry)
      },
    },
    showCollapseAll: true,
    title: () => activeSlidevData.value
      ? `Slides (${getSlidesTitle(activeSlidevData.value)})`
      : 'Slides',
  })

  const visible = useViewVisibility(treeView)
  const { previewNavState } = usePreviewWebview()
  watch(
    () => previewNavState.no,
    (no) => {
      if (!visible.value)
        return
      const slide = activeSlidevData.value?.slides[no - 1]
      if (!slide || !previewSync.value)
        return
      const path = (slide.importChain ?? []).concat(slide.source)
      const source = path.shift()
      let node = slidesTreeData.value?.find(e => e.slide === source)
      while (true) {
        const source = path.shift()
        if (!source) {
          if (node) {
            treeView.reveal(node, { select: true })
            commands.executeCommand('slidev.goto', ...getGotoCommandArgs(node))
          }
          return
        }
        node = node?.children?.find(e => e.slide === source)
        if (!node)
          return
      }
    },
  )

  return treeView
})

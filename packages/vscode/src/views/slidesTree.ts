import type { SlidevMarkdown, SourceSlideInfo } from '@slidev/types'
import type { TreeViewNode } from 'reactive-vscode'
import { isDeepEqual } from '@antfu/utils'
import { stringify } from '@slidev/parser/core'
import { computed, defineService, shallowRef, useTreeView, useViewVisibility, watch, watchEffect } from 'reactive-vscode'
import { DataTransferItem, ThemeIcon, TreeItemCollapsibleState, Uri, window, workspace } from 'vscode'
import { useFocusedSlide } from '../composables/useFocusedSlide'
import { activeData } from '../projects'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { toRelativePath } from '../utils/toRelativePath'

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
  'intro': 'debug-step-into',
  'outro': 'debug-step-out',
  'none': 'layout-statusbar',
  'quote': 'quote',
  'section': 'symbol-module', // TODO: a better icon
  'statement': 'megaphone',
  'two-cols-header': 'symbol-struct',
  'two-cols': 'split-horizontal',
} as Record<string, string>

export interface SlidesTreeNode extends TreeViewNode {
  markdownPath: string
  slideIndex: number
  readonly children?: this[]
}

export const useSlidesTree = defineService(() => {
  const { focusedSourceSlide, gotoSlide } = useFocusedSlide()

  const treeData = computed(() => {
    const data = activeData.value
    if (!data)
      return null

    const sourceToNode = new Map<string, SlidesTreeNode>()
    const createNode = (slide: SourceSlideInfo) => {
      const isFirstSlide = data.entry.slides.findIndex(s => s === slide) === 0
      const layoutName = slide.frontmatter.layout || (isFirstSlide ? 'cover' : 'default')
      const slideNo = slide.imports ? 0 : data.slides.findIndex(s => s.source === slide) + 1
      const label = slide.imports ? '' : `${slideNo}. ${slide.title || '(Untitled)'}`
      const description = slide.imports ? toRelativePath(slide.imports[0].filepath) : undefined
      const icon = slide.imports ? 'link-external' : layoutIconMap[layoutName] ?? 'window'
      const collapsibleState = slide.imports ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None

      const node: SlidesTreeNode = {
        markdownPath: slide.filepath,
        slideIndex: slide.index,
        children: slide.imports?.map(createNode),
        treeItem: {
          label,
          description,
          iconPath: new ThemeIcon(icon),
          collapsibleState,
          command: {
            command: 'slidev.goto',
            title: 'Goto',
            arguments: [slide.filepath, slide.index],
          },
        },
      }
      sourceToNode.set(`${slide.filepath}:${slide.index}`, node)
      return node
    }
    return {
      items: data.entry.slides.map(createNode),
      sourceToNode,
    }
  })

  const treeItems = shallowRef<SlidesTreeNode[]>([])
  const sourceToNode = shallowRef(new Map<string, SlidesTreeNode>())
  watch(treeData, (treeData) => {
    const newItems = treeData?.items || []
    if (!isDeepEqual(treeItems.value, newItems)) {
      treeItems.value = newItems
      sourceToNode.value = treeData?.sourceToNode || new Map()
    }
  }, { immediate: true })

  const treeView = useTreeView(
    'slidev-slides-tree',
    treeItems,
    {
      canSelectMany: true,
      dragAndDropController: {
        dragMimeTypes: [slideMineType],
        dropMimeTypes: [slideMineType],
        handleDrag(source, dataTransfer) {
          const data = activeData.value
          if (!data) {
            window.showErrorMessage(`Cannot drag and drop slides: No active slides project.`)
            return
          }
          const sources = source.map(node => data.markdownFiles[node.markdownPath]?.slides[node.slideIndex]).filter(Boolean)
          dataTransfer.set(slideMineType, new DataTransferItem(sources))
        },
        async handleDrop(target, dataTransfer) {
          const slides: SourceSlideInfo[] = dataTransfer.get(slideMineType)?.value
          const data = activeData.value
          if (!slides?.length || !target || !data)
            return
          if (slides.length === 0) {
            window.showErrorMessage(`Cannot drag and drop slides: None of the selected slides are in the entry Markdown.`)
            return
          }
          const targetIndex = target.slideIndex
          const targetMarkdown = data.markdownFiles[target.markdownPath]
          const oldSlides = targetMarkdown.slides.map(s => slides.includes(s) ? null : s)
          const before = oldSlides.slice(0, targetIndex + 1).filter(Boolean) as SourceSlideInfo[]
          const after = oldSlides.slice(targetIndex + 1).filter(Boolean) as SourceSlideInfo[]
          const newTargetMarkdown = {
            ...targetMarkdown,
            slides: [
              ...before,
              ...slides,
              ...after,
            ],
          }

          const changedMarkdown = new Set<SlidevMarkdown>([newTargetMarkdown])
          for (const markdown of Object.values(data.markdownFiles)) {
            if (markdown === targetMarkdown)
              continue // already handled
            const newSlides = markdown.slides.filter(s => !slides.includes(s))
            if (newSlides.length !== markdown.slides.length) {
              changedMarkdown.add({
                ...markdown,
                slides: newSlides,
              })
            }
          }

          for (const markdown of changedMarkdown) {
            const newContent = stringify(markdown)
            await workspace.fs.writeFile(
              Uri.file(markdown.filepath),
              (new TextEncoder()).encode(newContent),
            )
          }

          setTimeout(async () => {
            await gotoSlide(target.markdownPath, before.length)
          }, 100)
        },
      },
      showCollapseAll: true,
      title: () => activeData.value
        ? `Slides: ${getSlidesTitle(activeData.value)}`
        : 'Slides',
    },
  )

  const visible = useViewVisibility(treeView)
  const focusedNode = computed(() => {
    if (!focusedSourceSlide.value)
      return null
    const { filepath, index } = focusedSourceSlide.value
    return sourceToNode.value.get(`${filepath}:${index}`)
  })
  watchEffect(() => {
    if (visible.value && focusedNode.value) {
      treeView.reveal(focusedNode.value, { select: true })
    }
  })

  return {
    treeView,
  }
})

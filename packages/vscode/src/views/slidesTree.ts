import type { SlideInfo } from '@slidev/types'
import { onScopeDispose, watch } from '@vue/runtime-core'
import type { TreeItem } from 'vscode'
import { EventEmitter, window } from 'vscode'
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
    iconPath: iconName ? extCtx.value.asAbsolutePath(`res/icons/${iconName}.svg`) : undefined,
    command: {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [info.index],
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
    // TODO:
    // dragAndDropController: {
    //   dragMimeTypes: [slideMineType],
    //   dropMimeTypes: [slideMineType],
    //   handleDrag(source, dataTransfer, token) {
    //     source.forEach(s => dataTransfer.set(slideMineType,new DataTransferItem({
    //       raw: s.
    //     })))
    //   },
    // },
    showCollapseAll: true,
  })
  onScopeDispose(() => treeView.dispose())

  watch(activeSlidevData, () => onChange.fire())

  return treeView
})

import type { TreeViewNode } from 'reactive-vscode'
import type { TreeItem } from 'vscode'
import type { SlidevProject } from '../projects'
import { isDeepEqual } from '@antfu/utils'
import { computed, defineService, shallowRef, useTreeView, watch } from 'reactive-vscode'
import { ThemeIcon, TreeItemCollapsibleState, Uri } from 'vscode'
import { activeEntry, projects } from '../projects'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { toRelativePath } from '../utils/toRelativePath'

/**
 * No projects has dependency files. Then it would be weired to show a collapse button.
 */
const nothingToCollapse = computed(() => [...projects.values()]
  .every(project => Object.keys(project.data.markdownFiles).length <= 1))

function getProjectTreeItem(project: SlidevProject): TreeItem {
  const active = activeEntry.value === project.entry
  return {
    label: toRelativePath(project.entry),
    description: `${getSlidesTitle(project.data)}${project.detected.value?.ready ? ` (port: ${project.detected.value.port})` : ''}`,
    resourceUri: Uri.file(project.entry),
    iconPath: new ThemeIcon(active ? 'eye' : 'eye-closed'),
    collapsibleState: nothingToCollapse.value ? TreeItemCollapsibleState.None : active ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
    contextValue: `<project><${active ? 'active' : 'inactive'}>`,
    command: {
      title: 'Open',
      command: 'vscode.open',
      arguments: [Uri.file(project.entry)],
    },
  }
}

function getFileTreeItem(file: string): TreeItem {
  return {
    resourceUri: Uri.file(file),
    iconPath: new ThemeIcon('file'),
    collapsibleState: TreeItemCollapsibleState.None,
    command: {
      title: 'Open',
      command: 'vscode.open',
      arguments: [Uri.file(file)],
    },
  }
}

export const useProjectsTree = defineService(() => {
  const treeData = computed(() => {
    return [...projects.values()].map(project => ({
      treeItem: getProjectTreeItem(project),
      children: Object.keys(project.data.markdownFiles)
        .filter(file => file.toLowerCase() !== project.entry.toLowerCase())
        .map(file => ({ treeItem: getFileTreeItem(file) })),
    }))
  })

  const treeItems = shallowRef<TreeViewNode[]>([])
  watch(treeData, (treeData) => {
    if (!isDeepEqual(treeItems.value, treeData)) {
      treeItems.value = treeData
    }
  }, { immediate: true })

  const treeView = useTreeView('slidev-projects-tree', treeItems, {
    showCollapseAll: true,
  })

  return treeView
})

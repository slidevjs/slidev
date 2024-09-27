import type { TreeItem } from 'vscode'
import type { SlidevProject } from '../projects'
import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
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
    label: getSlidesTitle(project.data),
    description: `${toRelativePath(project.entry)}${project.port ? ` (port: ${project.port})` : ''}`,
    resourceUri: Uri.file(project.entry),
    iconPath: new ThemeIcon(active ? 'eye' : 'eye-closed'),
    collapsibleState: nothingToCollapse.value ? TreeItemCollapsibleState.None : active ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
    contextValue: `<project><${active ? 'active' : 'inactive'}><${project.port ? 'up' : 'down'}>`,
    command: {
      title: 'Open',
      command: 'vscode.open',
      arguments: [Uri.file(project.entry)],
    },
  }
}

function getFileTreeItem(file: string): TreeItem {
  return {
    description: toRelativePath(file),
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

export const useProjectsTree = createSingletonComposable(() => {
  const treeData = computed(() => {
    return [...projects.values()].map(project => ({
      treeItem: getProjectTreeItem(project),
      children: Object.keys(project.data.markdownFiles)
        .filter(file => file.toLowerCase() !== project.entry.toLowerCase())
        .map(file => ({ treeItem: getFileTreeItem(file) })),
    }))
  })

  const treeView = useTreeView('slidev-projects-tree', treeData, {
    showCollapseAll: true,
  })

  return treeView
})

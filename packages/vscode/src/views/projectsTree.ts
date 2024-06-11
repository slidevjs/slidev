import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
import type { TreeItem } from 'vscode'
import { ThemeIcon, TreeItemCollapsibleState, Uri } from 'vscode'
import type { SlidevProject } from '../projects'
import { activeEntry, projects } from '../projects'
import { getSlidesTitle } from '../utils/getSlidesTitle'
import { toRelativePath } from '../utils/toRelativePath'

/**
 * No projects has dependency files. Then it would be weired to show a collapse button.
 */
const nothingToCollapse = computed(() => [...projects.values()]
  .every(project => Object.keys(project.data.markdownFiles).length <= 1))

interface ProjectsTreeNode {
  data: SlidevProject | string
  children?: ProjectsTreeNode[]
}

function getTreeItem({ data }: ProjectsTreeNode): TreeItem {
  if (typeof data === 'string') {
    // Imported file
    return {
      description: toRelativePath(data),
      resourceUri: Uri.file(data),
      iconPath: new ThemeIcon('file'),
      collapsibleState: TreeItemCollapsibleState.None,
      command: {
        title: 'Open',
        command: 'vscode.open',
        arguments: [Uri.file(data)],
      },
    }
  }
  else {
    // Slides project
    const active = activeEntry.value === data.entry
    return {
      label: getSlidesTitle(data.data),
      description: `${toRelativePath(data.entry)}${data.port ? ` (port: ${data.port})` : ''}`,
      resourceUri: Uri.file(data.entry),
      iconPath: new ThemeIcon(active ? 'eye' : 'eye-closed'),
      collapsibleState: nothingToCollapse.value ? TreeItemCollapsibleState.None : active ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
      contextValue: `<project><${active ? 'active' : 'inactive'}><${data.port ? 'up' : 'down'}>`,
      command: {
        title: 'Open',
        command: 'vscode.open',
        arguments: [Uri.file(data.entry)],
      },
    }
  }
}

export const useProjectsTree = createSingletonComposable(() => {
  const treeData = computed<ProjectsTreeNode[]>(() => {
    return [...projects.values()].map(project => ({
      data: project,
      children: project.data.watchFiles
        .filter(file => file !== project.entry)
        .map(file => ({ data: file })),
    }))
  })

  const treeView = useTreeView('slidev-projects-tree', treeData, {
    getTreeItem,
    showCollapseAll: true,
  })

  return treeView
})

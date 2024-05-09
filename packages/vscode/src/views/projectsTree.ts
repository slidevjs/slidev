import type { TreeItem } from 'vscode'
import { EventEmitter, ThemeIcon, TreeItemCollapsibleState, Uri, window } from 'vscode'
import { computed, onScopeDispose, watch } from '@vue/runtime-core'
import { createSingletonComposable } from '../utils/singletonComposable'
import type { SlidevProject } from '../projects'
import { activeEntry, projects } from '../projects'
import { toRelativePath } from '../utils/toRelativePath'
import { getSlidesTitle } from '../utils/getSlidesTitle'

/**
 * No projects has dependency files. Then it would be weired to show a collapse button.
 */
const nothingToCollapse = computed(() => [...projects.values()]
  .every(project => Object.keys(project.data.markdownFiles).length <= 1))

function getTreeItem(element: SlidevProject | string): TreeItem {
  if (typeof element === 'string') {
    // Imported file
    return {
      description: true,
      resourceUri: Uri.file(element),
      iconPath: new ThemeIcon('file'),
      collapsibleState: TreeItemCollapsibleState.None,
      command: {
        title: 'Open',
        command: 'vscode.open',
        arguments: [Uri.file(element)],
      },
    }
  }
  else {
    // Slides project
    const active = activeEntry.value === element.entry
    return {
      label: getSlidesTitle(element.data),
      description: `${toRelativePath(element.entry)}${element.port ? ` (port: ${element.port})` : ''}`,
      resourceUri: Uri.file(element.entry),
      iconPath: new ThemeIcon(active ? 'eye' : 'eye-closed'),
      collapsibleState: nothingToCollapse.value ? TreeItemCollapsibleState.None : active ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
      contextValue: `<project><${active ? 'active' : 'inactive'}><${element.port ? 'up' : 'down'}>`,
      command: {
        title: 'Open',
        command: 'vscode.open',
        arguments: [Uri.file(element.entry)],
      },
    }
  }
}

export const useProjectsTree = createSingletonComposable(() => {
  const onChange = new EventEmitter<void>()

  const treeView = window.createTreeView('slidev-projects-tree', {
    treeDataProvider: {
      onDidChangeTreeData: onChange.event,
      getTreeItem,
      getChildren(element) {
        return element
          ? typeof element === 'string'
            ? undefined
            : element.data.watchFiles.filter(file => file !== element.entry)
          : [...projects.values()]
      },
    },
    showCollapseAll: true,
  })
  onScopeDispose(() => treeView.dispose())

  watch([projects, activeEntry], () => onChange.fire(), { deep: true })

  return treeView
})

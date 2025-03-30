import { computed, createSingletonComposable, useTreeView } from 'reactive-vscode'
import { ThemeIcon } from 'vscode'
import { useMcpServer } from '../composables/useMcpServer'

export const useMcpTreeView = createSingletonComposable(() => {
  const { state } = useMcpServer()
  const treeData = computed(() => {
    if (!state.status) {
      return []
    }

    return [
      ...state.tools.map(tool => ({
        treeItem: {
          label: tool.name,
          description: tool.description,
          iconPath: new ThemeIcon('symbol-method'),
          tooltip: tool.description,
          command: {
            command: 'slidev.mcp.copy-tool',
            title: 'Copy MCP Tool Name',
            arguments: [tool.name],
          },
        },
      })),
    ]
  })

  const treeView = useTreeView('slidev-mcp-tree', treeData, {
    showCollapseAll: false,
    title: computed(() => {
      if (!state.status)
        return 'MCP Server'

      return `MCP Server (running)`
    }),
  })

  return treeView
})

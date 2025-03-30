import type { FastMCP } from 'fastmcp'
import { computed, createSingletonComposable, reactive, useVscodeContext } from 'reactive-vscode'
import { window, workspace } from 'vscode'
import { mcpIDE, mcpPort, mcpUrl } from '../configs'
import { createMcpServerDefault } from '../utils/createMcpServer'
import { tools } from '../utils/createMcpTools'
import { updateIDEMcpConfig } from '../utils/updateIDEMcpConfig'
import { logger } from '../views/logger'

export const useMcpServer = createSingletonComposable(() => {
  const endpoint = '/sse'
  const state = reactive({
    status: false,
    tools,
  })
  useVscodeContext('slidev:mcp:status', () => state.status)

  let serverInstance: FastMCP | null = null

  /**
   * Start MCP service
   */
  async function start() {
    if (state.status) {
      window.showInformationMessage('MCP Server is already running.')
      return
    }
    try {
      if (!serverInstance) {
        serverInstance = await createMcpServerDefault({ tools })
      }
      serverInstance.start({
        transportType: 'sse',
        sse: {
          endpoint,
          port: mcpPort.value,
        },
      })
      state.status = true
      if (!!mcpIDE.value && workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
        const rootPath = workspace.workspaceFolders[0].uri.fsPath
        await updateIDEMcpConfig(
          rootPath,
          `${mcpUrl.value}${endpoint}`,
          mcpIDE.value,
        )
      }
      window.showInformationMessage(`Slidev MCP Server is started, url: ${mcpUrl.value}${endpoint}`)
    }
    catch (error) {
      window.showErrorMessage(`MCP Server Error: ${error}`)
      state.status = false
    }
  }

  /**
   * Stop MCP server
   */
  function stop() {
    if (state.status && serverInstance) {
      serverInstance.stop()
      state.status = false
      window.showInformationMessage('Slidev MCP Server is stopped.')
      logger.info('Slidev MCP Server is stopped.')
    }
    else {
      window.showInformationMessage('Slidev MCP Server is not running.')
    }
  }

  return {
    state,
    server: computed(() => serverInstance),
    url: computed(() => `${mcpUrl.value}${endpoint}`),
    start,
    stop,
  }
})

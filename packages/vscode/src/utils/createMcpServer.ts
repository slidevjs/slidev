import type { FastMCP, Tool } from 'fastmcp'
import { window } from 'vscode'
import { logger } from '../views/logger'

// Fastmcp does not support ESM, so we need to use dynamic import
let FastMCPModule: any = null

/**
 * Create a default MCP server
 * @returns {FastMCP}
 */
export async function createMcpServerDefault({ tools }: { tools: Tool<any, any>[] }): Promise<FastMCP> {
  if (!FastMCPModule) {
    try {
      FastMCPModule = await import('fastmcp')
    }
    catch (error) {
      logger.error('Failed to load FastMCP module:', error)
      window.showErrorMessage(`Failed to load MCP module: ${error}`)
      throw error
    }
  }
  try {
    const { FastMCP } = FastMCPModule
    const server = new FastMCP(
      {
        name: 'slidev',
        version: '1.0.0',
      },
    )

    for (const tool of tools) {
      server.addTool(tool)
    }

    server.on('connect', (event: any) => {
      logger.info('Client connected:', event.session)
    })

    server.on('disconnect', (event: any) => {
      logger.info('Client disconnected:', event.session)
    })

    return server
  }
  catch (error) {
    logger.error('Failed to create MCP server:', error)
    window.showErrorMessage(`Failed to create MCP server: ${error}`)
    throw error
  }
}

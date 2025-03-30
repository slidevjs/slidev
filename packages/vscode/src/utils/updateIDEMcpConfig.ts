import { Buffer } from 'node:buffer'
import { Uri, workspace } from 'vscode'
import { logger } from '../views/logger'
/**
 * Update the MCP config for IDEs.
 * This is used to set the MCP server URL for IDEs.
 *
 * @param root Project Root
 * @param type IDE type "cursor" | "vscode"
 * @param url MCP Server URL
 */
export async function updateIDEMcpConfig(root: string, url: string, type: 'cursor' | 'vscode' = 'cursor'): Promise<void> {
  try {
    const ideDirUri = Uri.file(`${root}/.${type}`)
    const mcpConfigUri = Uri.file(`${root}/.${type}/mcp.json`)

    try {
      await workspace.fs.stat(ideDirUri)
    }
    catch {
      logger.info(`No .${type} directory found, skipping MCP config update`)
      return
    }

    let mcpConfig: any = {}
    try {
      const mcpData = await workspace.fs.readFile(mcpConfigUri)
      mcpConfig = JSON.parse(Buffer.from(mcpData).toString('utf-8'))
    }
    catch {
      logger.info('Creating new MCP config')
      mcpConfig = {}
    }

    mcpConfig.mcpServers = mcpConfig.mcpServers || {}

    mcpConfig.mcpServers.slidev = { url }

    const configContent = `${JSON.stringify(mcpConfig, null, 2)}\n`
    await workspace.fs.writeFile(
      mcpConfigUri,
      Buffer.from(configContent, 'utf-8'),
    )

    logger.info(`Updated Cursor MCP config at ${mcpConfigUri.fsPath}`)
  }
  catch (error) {
    logger.error('Failed to update Cursor MCP config:', error)
  }
}

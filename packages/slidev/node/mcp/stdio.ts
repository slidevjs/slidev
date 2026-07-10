import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { version } from '../../package.json'
import { parser } from '../parser'
import { getRoots } from '../resolver'
import { createSlidevMcpServer } from './server'

/**
 * Start a Slidev MCP server over stdio, operating on the markdown files
 * directly (no dev server required, so no live-navigation tool).
 *
 * Note: in stdio mode, stdout is reserved for the MCP protocol — nothing
 * else may be printed to it.
 */
export async function startMcpStdioServer(entry: string) {
  const { userRoot } = await getRoots(entry)
  const server = createSlidevMcpServer({
    version,
    entry,
    // Reload from disk on every tool call, as the files may be edited
    // externally between calls
    getData: () => parser.load({ userRoot, roots: [userRoot] }, entry),
  })
  await server.connect(new StdioServerTransport())
}

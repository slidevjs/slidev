import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin, ViteDevServer } from 'vite'
import type { SlidevMcpContext } from '../mcp/server'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { version } from '../../package.json'
import { createSlidevMcpServer } from '../mcp/server'
import { getServerRefState } from './serverRef'

export const MCP_ENDPOINT = '/__mcp'

// Keep in sync with `vite-plugin-vue-server-ref` internals
const SERVER_REF_WS_EVENT = 'vue-server-ref'
const SERVER_REF_NAV_MODULE_IDS = ['/@server-reactive/nav', '/@server-ref/nav']

/**
 * Serves the Slidev MCP (Model Context Protocol) server on the dev server at
 * `/__mcp` (streamable HTTP transport), so AI agents can inspect, edit, and
 * navigate the slides. Can be disabled with `mcp: false` in the headmatter.
 */
export function createMcpPlugin(
  options: ResolvedSlidevOptions,
): Plugin {
  return {
    name: 'slidev:mcp',
    apply: 'serve',

    configureServer(server) {
      if (options.mode !== 'dev')
        return

      const ctx: SlidevMcpContext = {
        version,
        entry: options.entry,
        getData: () => options.data,
        getServerUrl: () => server.resolvedUrls?.local[0],
        nav: {
          getState: () => {
            const nav = getServerRefState(options)?.nav
            return { page: nav?.page ?? 0, clicks: nav?.clicks ?? 0 }
          },
          go: (page, clicks) => navigateClients(server, options, page, clicks),
        },
      }

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]?.replace(/\/$/, '')
        if (path !== MCP_ENDPOINT)
          return next()

        if (options.data.config.mcp === false) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'The Slidev MCP server is disabled (`mcp: false` in the headmatter)' },
            id: null,
          }))
          return
        }

        try {
          // Stateless mode: a fresh server + transport pair per request
          const mcp = createSlidevMcpServer(ctx)
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          })
          res.on('close', () => {
            transport.close()
            mcp.close()
          })
          await mcp.connect(transport)
          await transport.handleRequest(req, res)
        }
        catch (e) {
          console.error('[slidev] Error handling MCP request:', e)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32603, message: 'Internal server error' },
              id: null,
            }))
          }
        }
      })
    },
  }
}

/**
 * Drive all connected clients to the given slide by patching the shared
 * `nav` state, mimicking what `vite-plugin-vue-server-ref` does when a
 * presenter or remote-control client navigates.
 */
function navigateClients(
  server: ViteDevServer,
  options: ResolvedSlidevOptions,
  page: number,
  clicks: number,
) {
  const time = Date.now()

  const nav = getServerRefState(options)?.nav
  if (nav) {
    nav.page = page
    nav.clicks = clicks
    nav.lastUpdate = { id: 'slidev-mcp', type: 'presenter', time }
  }

  // Refresh the initial state served to newly loaded clients
  for (const id of SERVER_REF_NAV_MODULE_IDS) {
    const module = server.moduleGraph.getModuleById(id)
    if (module)
      server.moduleGraph.invalidateModule(module)
  }

  // Clients ignore patches attributed to their own role (presenter/viewer),
  // so send one patch as each role to reach both kinds of clients.
  for (const type of ['presenter', 'viewer'] as const) {
    server.hot.send({
      type: 'custom',
      event: SERVER_REF_WS_EVENT,
      data: {
        key: 'nav',
        source: 'slidev-mcp',
        patch: {
          page,
          clicks,
          lastUpdate: { id: 'slidev-mcp', type, time },
        },
        timestamp: time,
      },
    })
  }
}

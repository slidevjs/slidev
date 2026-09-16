import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import process from 'node:process'

type RouterMode = 'history' | 'hash'

const servers = new Map<RouterMode, { server: Server, baseUrl: string }>()
const base = '/deck/'
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.json', 'application/json'],
])

async function fileExists(file: string) {
  try {
    const info = await stat(file)
    return info.isFile()
  }
  catch {
    return false
  }
}

/**
 * Builds the basic fixture with a non-root `--base` in the given router mode and
 * serves the static output (with SPA fallback) on an ephemeral port.
 *
 * Returns the served base URL, e.g. `http://127.0.0.1:52341/deck/`.
 */
export async function startBasePathServer(routerMode: RouterMode = 'history'): Promise<string> {
  const existing = servers.get(routerMode)
  if (existing)
    return existing.baseUrl

  const outDir = `dist-${routerMode}`
  const root = join(import.meta.dirname, 'fixtures/basic', outDir)

  // Cypress runs its node events inside Electron; strip its env so the
  // spawned build runs under plain Node.
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.NODE_OPTIONS

  execFileSync(pnpm, ['--filter', './cypress/fixtures/basic', 'build', '--base', base, '--router-mode', routerMode, '--out', outDir], {
    cwd: join(import.meta.dirname, '..'),
    env,
    stdio: 'inherit',
  })

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')

    if (!url.pathname.startsWith(base)) {
      res.writeHead(404).end('Not found')
      return
    }

    const rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html'
    let file = normalize(join(root, rel))
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    if (!await fileExists(file))
      file = join(root, 'index.html')

    res.writeHead(200, { 'content-type': contentTypes.get(extname(file)) ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address() as AddressInfo
  const baseUrl = `http://127.0.0.1:${port}${base}`
  servers.set(routerMode, { server, baseUrl })
  return baseUrl
}

export async function stopBasePathServer() {
  await Promise.all(
    [...servers.values()].map(({ server }) =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()))
      }),
    ),
  )
  servers.clear()
  return null
}

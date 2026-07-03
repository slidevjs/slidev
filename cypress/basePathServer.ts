import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import process from 'node:process'

let server: Server | undefined
let baseUrl: string | undefined

const root = join(import.meta.dirname, 'fixtures/basic/dist')
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
 * Builds the basic fixture with a non-root `--base` and serves the static
 * output (with SPA fallback) on an ephemeral port.
 *
 * Returns the served base URL, e.g. `http://127.0.0.1:52341/deck/`.
 */
export async function startBasePathServer(): Promise<string> {
  if (server && baseUrl)
    return baseUrl

  // Cypress runs its node events inside Electron; strip its env so the
  // spawned build runs under plain Node.
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.NODE_OPTIONS

  execFileSync(pnpm, ['--filter', './cypress/fixtures/basic', 'build', '--base', base], {
    cwd: join(import.meta.dirname, '..'),
    env,
    stdio: 'inherit',
  })

  server = createServer(async (req, res) => {
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
    server!.once('error', reject)
    server!.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}${base}`
  return baseUrl
}

export function stopBasePathServer() {
  return new Promise<null>((resolve, reject) => {
    if (!server) {
      resolve(null)
      return
    }

    server.close((error) => {
      server = undefined
      baseUrl = undefined
      if (error)
        reject(error)
      else
        resolve(null)
    })
  })
}

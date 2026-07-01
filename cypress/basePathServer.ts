import type { Server } from 'node:http'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import process from 'node:process'

let server: Server | undefined

const root = join(import.meta.dirname, 'fixtures/basic/dist')
const base = '/deck/'
const port = 4173
const origin = `http://127.0.0.1:${port}`
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

export async function startBasePathServer() {
  if (server)
    return null

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
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)

    if (!url.pathname.startsWith(base)) {
      res.writeHead(404).end('Not found')
      return
    }

    const rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html'
    let file = normalize(join(root, rel))
    if (!file.startsWith(root)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    if (!await fileExists(file))
      file = join(root, 'index.html')

    res.writeHead(200, { 'content-type': contentTypes.get(extname(file)) ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })

  return new Promise<null>((resolve, reject) => {
    server!.once('error', reject)
    server!.listen(port, '127.0.0.1', () => resolve(null))
  })
}

export function stopBasePathServer() {
  return new Promise<null>((resolve, reject) => {
    if (!server) {
      resolve(null)
      return
    }

    server.close((error) => {
      server = undefined
      if (error)
        reject(error)
      else
        resolve(null)
    })
  })
}

export async function assertBasePathNavigation() {
  await startBasePathServer()

  const expected = `${origin}${base}2`
  const { chromium } = await import('playwright-chromium')
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    await page.goto(`${origin}${base}1`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#page-root')
    await page.keyboard.press('ArrowRight')

    try {
      await page.waitForFunction(url => location.href === url, expected, { timeout: 5_000 })
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Expected slide navigation to end at ${expected}, got ${page.url()}. ${message}`)
    }

    return null
  }
  finally {
    await browser.close()
  }
}

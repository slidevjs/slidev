import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { join, resolve } from 'pathe'
import { chromium } from 'playwright-chromium'
import sharp from 'sharp'

const temporary = await fs.mkdtemp(join(tmpdir(), 'slidev-html-browser-'))
const source = join(temporary, 'source')
const run = promisify(execFile)
const cli = resolve('packages/slidev/bin/slidev.mjs')
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined

try {
  await fs.cp(resolve('test/fixtures/html'), source, { recursive: true })
  await fs.mkdir(join(source, 'public'), { recursive: true })
  await fs.copyFile(resolve('assets/logo.svg'), join(source, 'public/image.svg'))
  await fs.symlink(resolve('node_modules'), join(source, 'node_modules'), process.platform === 'win32'
    ? 'junction'
    : 'dir')
  await fs.writeFile(join(source, 'package.json'), JSON.stringify({ name: 'html-export-fixture', private: true, type: 'module' }))
  await fs.copyFile(resolve('node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2'), join(source, 'public/fixture-font.woff2'))
  const image = await sharp({
    create: {
      width: 128,
      height: 64,
      channels: 4,
      background: '#ff000080',
    },
  }).png().toBuffer()
  await fs.writeFile(join(source, 'public/photo.png'), image)
  const audio = Buffer.alloc(44 + 16000)
  audio.write('RIFF', 0)
  audio.writeUInt32LE(audio.length - 8, 4)
  audio.write('WAVEfmt ', 8)
  audio.writeUInt32LE(16, 16)
  audio.writeUInt16LE(1, 20)
  audio.writeUInt16LE(1, 22)
  audio.writeUInt32LE(8000, 24)
  audio.writeUInt32LE(16000, 28)
  audio.writeUInt16LE(2, 32)
  audio.writeUInt16LE(16, 34)
  audio.write('data', 36)
  audio.writeUInt32LE(16000, 40)
  await fs.writeFile(join(source, 'public/tone.wav'), audio)
  const output = join(temporary, 'build/presentation.html')
  const command = [
    'export',
    'slides.md',
    '--format',
    'html',
    '--without-notes',
    '--output',
    output,
  ]
  const result = await run(process.execPath, [cli, ...command], { cwd: source, maxBuffer: 8 * 1024 * 1024 })
  console.log(result.stdout)
  const html = await fs.readFile(output, 'utf8')
  assert(!html.includes('HTML_EXPORT_PRIVATE_NOTE'), 'Speaker notes leaked into HTML')
  assert.deepEqual(await fs.readFile(join(source, 'public/photo.png')), image, 'Source image changed')
  await assert.rejects(run(process.execPath, [cli, ...command, '--max-bytes', '1'], { cwd: source }), 'Impossible budget must fail')
  assert.equal(await fs.readFile(output, 'utf8'), html, 'Failed export replaced the existing output')
  await fs.mkdir(join(temporary, 'isolated'))
  const isolated = join(temporary, 'isolated/presentation.html')
  await fs.copyFile(output, isolated)
  browser = await chromium.launch()
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ offline: true, viewport })
    try {
      const page = await context.newPage()
      const errors: string[] = []
      const requests: string[] = []
      const failures: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => requests.push(request.url()))
      page.on('requestfailed', request => failures.push(`${request.url()} ${request.failure()?.errorText}`))
      await page.goto(`${pathToFileURL(isolated)}#/1`)
      await page.locator('.slidev-page-1').waitFor({ state: 'visible' })
      const registered = new Set(await page.evaluate(() => (globalThis as typeof globalThis & { __slidev_assets: string[] }).__slidev_assets))
      assert(await page.evaluate(() => Object.isFrozen((globalThis as typeof globalThis & { __slidev_assets: string[] }).__slidev_assets)), 'Asset registry is not frozen')
      await page.evaluate(() => document.fonts.ready)
      await page.waitForFunction(() => [
        ...document.querySelectorAll<HTMLImageElement>('.slidev-page-1 img'),
      ].every(image => image.complete && image.naturalWidth > 0))
      assert.equal(await page.locator('#processed-image').evaluate((image: HTMLImageElement) => image.naturalWidth), 64, 'Embedded image dimensions were not reduced')
      assert(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Fixture' && font.status === 'loaded')), 'Embedded font failed to load')
      assert(await page.locator('.offline-crop').evaluate(element => getComputedStyle(element).backgroundImage.startsWith('url("blob:')), 'CSS background was not embedded')
      assert(await page.locator('.offline-inline-crop').evaluate(element => getComputedStyle(element).backgroundImage.startsWith('url("blob:')), 'Inline CSS background was not embedded')
      assert(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running')), 'Finite animation did not run')
      await page.keyboard.press('ArrowRight')
      await page.getByText('First reveal').waitFor({ state: 'visible' })
      await page.keyboard.press('ArrowRight')
      await page.getByText('Second reveal').waitFor({ state: 'visible' })
      await page.keyboard.press('ArrowRight')
      const media = page.locator('.slidev-page-2 audio')
      await media.waitFor({ state: 'visible' })
      await media.evaluate(async (element: HTMLAudioElement) => {
        element.muted = true
        await element.play()
      })
      await page.waitForFunction(() => (document.querySelector('.slidev-page-2 audio') as HTMLAudioElement).currentTime > 0)
      await media.evaluate((element: HTMLAudioElement) => element.pause())
      await page.keyboard.press('ArrowRight')
      const counter = page.locator('.slidev-page-3 #offline-counter')
      await counter.waitFor({ state: 'visible' })
      await page.locator('.slidev-page-3 .mermaid svg').waitFor({ state: 'visible' })
      await counter.click()
      assert.equal(await counter.textContent(), 'Count: 1')
      await page.reload()
      await page.locator('.slidev-page-3').waitFor({ state: 'visible' })
      const reloaded = await page.evaluate(() => (globalThis as typeof globalThis & { __slidev_assets: string[] }).__slidev_assets)
      assert(reloaded.length > 0, 'Asset registry missing after reload')
      for (const url of reloaded)
        registered.add(url)
      assert.deepEqual(errors, [], 'Browser runtime errors')
      assert.deepEqual(failures, [], 'Failed resource requests')
      assert.deepEqual(requests.filter(url => !registered.has(url) && !url.startsWith('data:') && url !== pathToFileURL(isolated).href), [], 'Dependencies outside the isolated HTML')
      console.log(`${viewport.width}x${viewport.height}: offline navigation, reveals, font, images, animation, audio, interaction and reload passed`)
    }
    finally {
      await context.close()
    }
  }
  const remoteRequests: string[] = []
  const remoteImage = await fs.readFile(join(source, 'public/image.svg'))
  const server = createServer((request, response) => {
    remoteRequests.push(request.url || '')
    if (request.url === '/image.svg') {
      response.setHeader('content-type', 'image/svg+xml')
      response.end(remoteImage)
    }
    else {
      response.setHeader('content-type', 'text/html')
      response.end('<h1>Online frame</h1>')
    }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    assert(address && typeof address === 'object')
    const origin = `http://127.0.0.1:${address.port}`
    await fs.writeFile(join(source, 'online.md'), `---
theme: none
monaco: false
favicon: /image.svg
fonts:
  provider: none
export:
  html:
    allowRemote: true
---
# Online content
<img id="local-image" src="/image.svg">
<img id="remote-image" src="${origin}/image.svg">
<iframe id="online-frame" src="${origin}/frame" title="Online frame"></iframe>
`)
    const onlineOutput = join(temporary, 'build/online.html')
    const onlineCommand = [
      'export',
      'online.md',
      '--format',
      'html',
      '--output',
      onlineOutput,
    ]
    await fs.writeFile(onlineOutput, 'previous output')
    await assert.rejects(run(process.execPath, [cli, ...onlineCommand, '--no-allow-remote'], { cwd: source }), /<iframe>/)
    assert.equal(await fs.readFile(onlineOutput, 'utf8'), 'previous output', 'CLI opt-out replaced existing output')
    const onlineResult = await run(process.execPath, [cli, ...onlineCommand], { cwd: source, maxBuffer: 8 * 1024 * 1024 })
    assert(onlineResult.stderr.includes('require connectivity'), 'Remote export did not warn about connectivity')
    assert.deepEqual(remoteRequests, [], 'Remote resources were downloaded instead of retained')
    const onlineIsolated = join(temporary, 'isolated/online.html')
    await fs.copyFile(onlineOutput, onlineIsolated)
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const errors: string[] = []
      const failures: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('requestfailed', request => failures.push(request.url()))
      await page.goto(`${pathToFileURL(onlineIsolated)}#/1`)
      await page.frameLocator('#online-frame').getByRole('heading', { name: 'Online frame' }).waitFor({ state: 'visible' })
      await page.waitForFunction(() => [
        ...document.querySelectorAll<HTMLImageElement>('.slidev-page-1 img'),
      ].every(image => image.complete && image.naturalWidth > 0))
      assert((await page.locator('#local-image').getAttribute('src'))?.startsWith('blob:'), 'Local asset was not embedded')
      assert.equal(await page.locator('#remote-image').getAttribute('src'), `${origin}/image.svg`)
      assert(remoteRequests.includes('/frame') && remoteRequests.includes('/image.svg'), 'Retained online resources were not loaded')
      assert.deepEqual(errors, [], 'Online export runtime errors')
      assert.deepEqual(failures, [], 'Online export resource failures')
      console.log('allowRemote: online iframe/image playback, embedded local image, warning and CLI opt-out passed')
    }
    finally {
      await context.close()
    }
  }
  finally {
    await new Promise<void>((resolve, reject) => server.close(error => error
      ? reject(error)
      : resolve()))
  }
}
finally {
  await browser?.close()
  await fs.rm(temporary, { recursive: true, force: true })
}

import type { ResolvedSlidevOptions } from '@slidev/types'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { build, parseSync } from 'vite'
import { afterEach, expect, it } from 'vitest'
import { assertStandaloneContent, createSingleFilePlugins, HtmlAssetPackager } from './singlefile'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })))
})

async function fixture(allowRemote = false) {
  const root = await fs.mkdtemp(join(tmpdir(), 'slidev-html-assets-'))
  temporary.push(root)
  await fs.mkdir(join(root, 'public'))
  const image = await fs.readFile(new URL('../../../../assets/logo.svg', import.meta.url), 'utf8')
  await fs.writeFile(join(root, 'public/image.svg'), image)
  const packager = new HtmlAssetPackager({
    roots: [root],
    allowRemote,
    publicRoots: [
      {
        prefix: '',
        root: join(root, 'public'),
      },
    ],
  })
  return { root, image, packager }
}

it('deduplicates HTML, responsive images, CSS and JavaScript into one asset registry', async () => {
  const { image, packager } = await fixture()
  const html = await packager.html('<html><head><style>.crop{background:url(/image.svg)}</style><script type="module">globalThis.image="/image.svg"</script></head><body><img src="/image.svg" srcset="/image.svg 1x, /image.svg 2x"><a href="https://example.com">Link</a></body></html>', code => parseSync('fixture.js', code).program)
  expect(packager.assets).toHaveLength(1)
  expect(html.split(Buffer.from(image).toString('base64'))).toHaveLength(2)
  expect(html).toContain('globalThis.__slidev_assets[0]')
  expect(html).toContain('href="https://example.com"')
  expect(html).toContain('data-slidev-assets')
})

it('preserves fragments and rejects missing assets and paths outside permitted roots', async () => {
  const { root, packager } = await fixture()
  expect(await packager.embed('/image.svg?v=2#icon')).toBe('slidev-asset:0#icon')
  await expect(packager.embed('/missing.png')).rejects.toThrow('not found')
  await fs.symlink('/etc/hosts', join(root, 'public/outside.svg'))
  await expect(packager.embed('/outside.svg')).rejects.toThrow('outside permitted roots')
})

it('rejects external scripts instead of producing an online-dependent artifact', async () => {
  const { packager } = await fixture()
  await expect(packager.html('<script src="https://example.com/embed.js"></script>', () => undefined)).rejects.toThrow('External script')
})

it('rejects authored live embeds but permits Markdown code examples of them', () => {
  expect(() => assertStandaloneContent('<Youtube id="fixture" />')).toThrow('not supported')
  expect(() => assertStandaloneContent('<iframe src="https://example.com"></iframe>')).toThrow('not supported')
  expect(() => assertStandaloneContent('```html\n<iframe src="https://example.com"></iframe>\n```')).not.toThrow()
})

it('retains online resources when allowed while embedding local resources', async () => {
  const { packager } = await fixture(true)
  const html = await packager.html('<html><head><link rel="stylesheet" href="//example.invalid/fonts.css"><style>@import "//example.invalid/style.css" screen;.crop{background:url(//example.invalid/image.svg)}</style><script src="https://example.invalid/embed.js"></script></head><body><iframe src="//example.invalid/frame"></iframe><object data="https://example.invalid/document.pdf"></object><embed src="https://example.invalid/document.pdf"><img src="https://example.invalid/photo.png"><img src="/image.svg"></body></html>', () => undefined)
  expect(html).toContain('href="https://example.invalid/fonts.css"')
  expect(html).toContain('@import "https://example.invalid/style.css" screen')
  expect(html).toContain('url("https://example.invalid/image.svg")')
  expect(html).toContain('src="https://example.invalid/embed.js"')
  expect(html).toContain('src="https://example.invalid/frame"')
  expect(html).toContain('data="https://example.invalid/document.pdf"')
  expect(html).toContain('src="https://example.invalid/document.pdf"')
  expect(html).toContain('src="https://example.invalid/photo.png"')
  expect(packager.assets).toHaveLength(1)
  const code = 'const props={src:"//example.invalid/image.svg"};'
  expect(await packager.javascript(code, code => parseSync('fixture.js', code).program)).toContain('https://example.invalid/image.svg')
})

it('allows known online embeds only with explicit permission', () => {
  for (const content of [
    '<Youtube id="fixture" />',
    '<Tweet id="fixture" />',
    '<BlueSky url="https://example.invalid/post" />',
    '<iframe src="https://example.invalid"></iframe>',
    '<object data="https://example.invalid/document.pdf"></object>',
    '<embed src="//example.invalid/document.pdf">',
  ]) {
    expect(() => assertStandaloneContent(content)).toThrow('not supported')
    expect(() => assertStandaloneContent(content, true)).not.toThrow()
  }
  expect(() => assertStandaloneContent('<iframe src="/document.html"></iframe>', true)).toThrow('not supported')
  expect(() => assertStandaloneContent('<iframe srcdoc="hello"></iframe>', true)).toThrow('not supported')
})

it('keeps local resource, embedded document and configuration checks when remote resources are allowed', async () => {
  const { root, packager } = await fixture(true)
  await expect(packager.embed('/missing.png')).rejects.toThrow('not found')
  await fs.symlink('/etc/hosts', join(root, 'public/outside.svg'))
  await expect(packager.embed('/outside.svg')).rejects.toThrow('outside permitted roots')
  await expect(packager.html('<iframe src="/document.html"></iframe>', () => undefined)).rejects.toThrow('External iframe')
  await expect(packager.html('<iframe srcdoc="hello"></iframe>', () => undefined)).rejects.toThrow('Embedded documents')
  await expect(packager.html('<object data="/document.pdf"></object>', () => undefined)).rejects.toThrow('Embedded documents')
  await expect(packager.html('<base href="https://example.invalid/">', () => undefined)).rejects.toThrow('custom base')
  await expect(packager.html('<meta http-equiv="Content-Security-Policy" content="default-src none">', () => undefined)).rejects.toThrow('Content-Security-Policy')
})

it('does not interpret inactive download defaults or arbitrary extension strings as resource dependencies', async () => {
  const { packager } = await fixture()
  const code = 'const download = "./slidev-exported.pdf"; const extension = ".png";'
  expect(await packager.javascript(code, code => parseSync('fixture.js', code).program)).toBe(code)
})

it('embeds compiled Vue responsive images and inline backgrounds without changing external hyperlinks', async () => {
  const { packager } = await fixture()
  const code = 'const props={srcset:"/image.svg 1x, /image.svg 2x",style:{backgroundImage:"url(/image.svg)"},href:"https://example.com/image.svg",link:"//example.com/image.svg"};'
  const result = await packager.javascript(code, code => parseSync('fixture.js', code).program)
  expect(result).not.toContain('"/image.svg')
  expect(result).toContain('globalThis.__slidev_assets')
  expect(result).toContain('href:"https://example.com/image.svg"')
  expect(result).toContain('link:"//example.com/image.svg"')
  expect(packager.assets).toHaveLength(1)
})

it('packages a real Vite build with imported assets and dynamic imports', async () => {
  const { root, image } = await fixture()
  await fs.writeFile(join(root, 'index.html'), '<html><body><img id="image"><script type="module" src="/main.js"></script></body></html>')
  await fs.writeFile(join(root, 'picture.svg'), image)
  await fs.writeFile(join(root, 'main.js'), 'import image from "./picture.svg"; import "./style.css"; document.querySelector("img").src = image; import("./lazy.js").then(module => module.run())')
  await fs.writeFile(join(root, 'lazy.js'), 'export function run() { document.body.dataset.loaded = "yes" }')
  await fs.writeFile(join(root, 'style.css'), '.crop{background:url(/image.svg)}')
  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: createSingleFilePlugins({
      roots: [root],
      userRoot: root,
      themeRoots: [],
      addonRoots: [],
    } as unknown as ResolvedSlidevOptions),
  })
  const html = await fs.readFile(join(root, 'dist/index.html'), 'utf8')
  expect(html).toContain('__slidev_assets')
  expect(html).not.toMatch(/<script[^>]+src=/)
  expect(html).not.toContain('import("./lazy')
  expect(html.split(Buffer.from(image).toString('base64'))).toHaveLength(2)
})

it('rejects unresolved worker resources even when remote content is allowed', async () => {
  const { root } = await fixture()
  await fs.writeFile(join(root, 'index.html'), '<html><body>Fixture</body></html>')
  await expect(build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'fixture:worker',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'worker.js', source: 'self.onmessage = () => {}' })
        },
      },
      ...createSingleFilePlugins({
        roots: [root],
        userRoot: root,
        themeRoots: [],
        addonRoots: [],
      } as unknown as ResolvedSlidevOptions, { allowRemote: true }),
    ],
  })).rejects.toThrow('unresolved JavaScript resource: worker.js')
})

it('embeds remote stylesheets and their relative font resources at build time', async () => {
  const { packager } = await fixture()
  const server = http.createServer((request, response) => {
    if (request.url === '/fonts.css') {
      response.setHeader('content-type', 'text/css')
      response.end('@font-face{font-family:Fixture;src:url(./fixture.woff2)}')
    }
    else {
      response.setHeader('content-type', 'font/woff2')
      response.end('fixture font')
    }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address() as { port: number }
    const html = await packager.html(`<link rel="stylesheet" href="http://127.0.0.1:${address.port}/fonts.css">`, () => undefined)
    expect(html).not.toContain('http://127.0.0.1')
    expect(packager.assets).toHaveLength(1)
    expect(packager.assets[0].type).toBe('font/woff2')
  }
  finally {
    await new Promise<void>((resolve, reject) => server.close(error => error
      ? reject(error)
      : resolve()))
  }
})

it('resizes images without upscaling or changing source files or transparency', async () => {
  const { root } = await fixture()
  const { default: sharp } = await import('sharp')
  const source = await sharp({
    create: {
      width: 100,
      height: 50,
      channels: 4,
      background: '#ff000080',
    },
  }).png().toBuffer()
  const filename = join(root, 'public/photo.png')
  await fs.writeFile(filename, source)
  const packager = new HtmlAssetPackager({
    roots: [root],
    publicRoots: [
      {
        prefix: '',
        root: join(root, 'public'),
      },
    ],
    images: { maxWidth: 20 },
  })
  await packager.embed('/photo.png')
  const metadata = await sharp(Buffer.from(packager.assets[0].encoded, 'base64')).metadata()
  expect(metadata.width).toBe(20)
  expect(metadata.height).toBe(10)
  expect(metadata.hasAlpha).toBe(true)
  expect(await fs.readFile(filename)).toEqual(source)
})

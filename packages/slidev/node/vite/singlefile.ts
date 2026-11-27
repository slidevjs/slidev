import type { HtmlExportOptions, ResolvedSlidevOptions } from '@slidev/types'
import type { DefaultTreeAdapterMap } from 'parse5'
import type { PluginOption } from 'vite'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import MagicString from 'magic-string'
import MarkdownExit from 'markdown-exit'
import { lookup } from 'mrmime'
import { parse, parseFragment, serialize } from 'parse5'
import { dirname, isAbsolute, relative, resolve } from 'pathe'
import postcss from 'postcss'
import valueParser from 'postcss-value-parser'
import { parseSrcset, stringifySrcset } from 'srcset'
import { viteSingleFile } from 'vite-plugin-singlefile'

type HtmlNode = DefaultTreeAdapterMap['node']
type HtmlElement = DefaultTreeAdapterMap['element']

export interface HtmlAsset {
  type: string
  encoded: string
  name: string
}

export interface HtmlAssetOptions {
  roots: string[]
  publicRoots: { prefix: string, root: string }[]
  files?: Map<string, Uint8Array>
  images?: HtmlExportOptions['images']
  allowRemote?: boolean
}

const RE_ASSET = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|ogv|mp3|wav|ogg|m4a)(?:[?#].*)?$/i
const RE_DATA = /data:([\w.+/-]+);base64,([A-Za-z0-9+/=]+)/g
const RE_TOKEN = /^slidev-asset:(\d+)(#.*)?$/
const RE_REMOTE = /^(?:https?:)?\/\//i
const MAX_RESOURCE_BYTES = 32 * 1024 * 1024
const MAX_TOTAL_BYTES = 128 * 1024 * 1024

function children(node: HtmlNode): HtmlNode[] {
  return 'childNodes' in node
    ? node.childNodes
    : []
}

function within(root: string, filename: string) {
  const path = relative(root, filename)
  return path === '' || (!path.startsWith('../') && !isAbsolute(path))
}

export function assertStandaloneContent(content: string, allowRemote = false) {
  const document = parse(MarkdownExit({ html: true }).render(content))
  function visit(node: HtmlNode) {
    if ('tagName' in node && [
      'iframe',
      'object',
      'embed',
      'youtube',
      'tweet',
      'bluesky',
    ].includes(node.tagName)) {
      const resource = node.attrs.find(attr => attr.name === (node.tagName === 'object'
        ? 'data'
        : 'src'))
      const remote = ['youtube', 'tweet', 'bluesky'].includes(node.tagName)
        || (resource && RE_REMOTE.test(resource.value) && !node.attrs.some(attr => attr.name === 'srcdoc'))
      if (!allowRemote || !remote)
        throw new Error(`[slidev] <${node.tagName}> requires an embedded document or online service and is not supported in standalone HTML${remote ? '; enable export.html.allowRemote to retain online content' : ''}`)
    }
    for (const child of children(node))
      visit(child)
  }
  visit(document)
}

export class HtmlAssetPackager {
  readonly assets: HtmlAsset[] = []
  private readonly indexes = new Map<string, number>()
  private readonly cache = new Map<string, Promise<string>>()
  private downloaded = 0

  constructor(private readonly options: HtmlAssetOptions) {}

  private async register(bytes: Uint8Array, type: string, name: string) {
    let data = Buffer.from(bytes)
    const images = this.options.images
    if (images && Object.values(images).some(value => value !== undefined) && /^image\/(?:png|jpeg|webp|avif)$/.test(type)) {
      const { default: sharp } = await import('sharp')
      const source = sharp(data, { animated: true })
      const metadata = await source.metadata()
      if (!metadata.pages || metadata.pages === 1) {
        let image = source.rotate()
        if (images.maxWidth !== undefined || images.maxHeight !== undefined) {
          image = image.resize({
            width: images.maxWidth,
            height: images.maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          })
        }
        if (type !== 'image/png') {
          if (images.quality === undefined && (type === 'image/jpeg'))
            throw new Error(`[slidev] Resizing JPEG requires an explicit image quality: ${name}`)
          if (type === 'image/jpeg') {
            image = image.jpeg({ quality: images.quality })
          }
          else if (type === 'image/webp') {
            image = image.webp(images.quality === undefined
              ? { lossless: true }
              : { quality: images.quality })
          }
          else {
            image = image.avif(images.quality === undefined
              ? { lossless: true }
              : { quality: images.quality })
          }
        }
        data = Buffer.from(await image.toBuffer())
      }
    }
    const key = `${type}:${createHash('sha256').update(data).digest('hex')}`
    let index = this.indexes.get(key)
    if (index === undefined) {
      index = this.assets.length
      this.indexes.set(key, index)
      this.assets.push({
        type,
        encoded: data.toString('base64'),
        name,
      })
    }
    return `slidev-asset:${index}`
  }

  async embed(value: string, base?: string): Promise<string> {
    if (!value || value.startsWith('#') || RE_TOKEN.test(value) || value.startsWith('blob:'))
      return value
    if (value.startsWith('data:')) {
      const match = /^data:([\w.+/-]+);base64,([A-Za-z0-9+/=]+)(#.*)?$/.exec(value)
      return match
        ? await this.register(Buffer.from(match[2], 'base64'), match[1], 'inline asset') + (match[3] || '')
        : value
    }
    if (this.options.allowRemote && (RE_REMOTE.test(value) || base?.startsWith('http'))) {
      return new URL(value.startsWith('//')
        ? `https:${value}`
        : value, base).href
    }
    const key = `${base || ''}\0${value}`
    if (!this.cache.has(key)) {
      this.cache.set(key, this.read(value, base).then(async ({ bytes, type, fragment, name }) =>
        await this.register(bytes, type, name) + fragment))
    }
    return this.cache.get(key)!
  }

  private async read(value: string, base?: string) {
    if (RE_REMOTE.test(value) || base?.startsWith('http')) {
      const url = new URL(value.startsWith('//')
        ? `https:${value}`
        : value, base)
      const fragment = url.hash
      url.hash = ''
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok)
        throw new Error(`[slidev] Cannot embed ${url}: HTTP ${response.status}`)
      const chunks: Uint8Array[] = []
      let size = 0
      for await (const chunk of response.body!) {
        size += chunk.length
        this.downloaded += chunk.length
        if (size > MAX_RESOURCE_BYTES || this.downloaded > MAX_TOTAL_BYTES)
          throw new Error(`[slidev] Remote resources exceed the standalone download limit: ${url}`)
        chunks.push(chunk)
      }
      return {
        bytes: Buffer.concat(chunks),
        type: response.headers.get('content-type')?.split(';')[0] || lookup(url.pathname) || 'application/octet-stream',
        name: response.url || url.href,
        fragment,
      }
    }
    if (/^[a-z][\w+.-]*:/i.test(value))
      throw new Error(`[slidev] Unsupported standalone resource: ${value}`)
    const [pathname] = value.split(/[?#]/)
    const fragment = value.includes('#')
      ? value.slice(value.indexOf('#'))
      : ''
    const decoded = decodeURIComponent(pathname)
    const fileKey = decoded.replace(/^\.?\//, '')
    const emitted = this.options.files?.get(fileKey)
    if (emitted) {
      return {
        bytes: emitted,
        type: lookup(pathname) || 'application/octet-stream',
        name: pathname,
        fragment,
      }
    }
    const candidates = base && !decoded.startsWith('/')
      ? [
          resolve(dirname(base), decoded),
        ]
      : this.options.publicRoots.filter(({ prefix }) => fileKey.startsWith(prefix)).map(({ root, prefix }) => resolve(root, fileKey.slice(prefix.length)))
    for (const candidate of candidates) {
      const real = await fs.realpath(candidate).catch(() => undefined)
      if (!real)
        continue
      const roots = await Promise.all(this.options.roots.map(root => fs.realpath(root)))
      if (!roots.some(root => within(root, real)))
        throw new Error(`[slidev] Standalone asset is outside permitted roots: ${value}`)
      if (!(await fs.stat(real)).isFile())
        continue
      return {
        bytes: await fs.readFile(real),
        type: lookup(real) || 'application/octet-stream',
        name: real,
        fragment,
      }
    }
    throw new Error(`[slidev] Standalone asset not found: ${value}`)
  }

  async css(code: string, base?: string, depth = 0): Promise<string> {
    if (depth > 8)
      throw new Error('[slidev] Standalone CSS imports exceed the maximum depth')
    const root = postcss.parse(code)
    const imports: postcss.AtRule[] = []
    root.walkAtRules('import', (rule) => {
      imports.push(rule)
    })
    for (const rule of imports) {
      const parsed = valueParser(rule.params)
      const first = parsed.nodes[0]
      const reference = first?.type === 'string'
        ? first.value
        : first?.type === 'function'
          ? valueParser.stringify(first.nodes).replace(/^['"]|['"]$/g, '')
          : undefined
      if (!reference)
        throw new Error(`[slidev] Unsupported standalone CSS import: ${rule.params}`)
      if (this.options.allowRemote && (RE_REMOTE.test(reference) || base?.startsWith('http'))) {
        const url = new URL(reference.startsWith('//')
          ? `https:${reference}`
          : reference, base)
        rule.params = `${JSON.stringify(url.href)} ${valueParser.stringify(parsed.nodes.slice(1)).trim()}`.trim()
        continue
      }
      const source = await this.read(reference, base)
      const nested = postcss.parse(await this.css(Buffer.from(source.bytes).toString('utf8'), source.name, depth + 1))
      const media = valueParser.stringify(parsed.nodes.slice(1)).trim()
      if (media) {
        const wrapper = postcss.atRule({ name: 'media', params: media })
        wrapper.append(nested.nodes)
        rule.replaceWith(wrapper)
      }
      else {
        rule.replaceWith(...nested.nodes)
      }
    }
    const declarations: postcss.Declaration[] = []
    root.walkDecls((declaration) => {
      declarations.push(declaration)
    })
    for (const declaration of declarations) {
      const parsed = valueParser(declaration.value)
      const references: { node: valueParser.FunctionNode, value: string }[] = []
      parsed.walk((node) => {
        if (node.type !== 'function' || node.value.toLowerCase() !== 'url')
          return
        const reference = node.nodes.find(child => child.type === 'word' || child.type === 'string')
        if (reference)
          references.push({ node, value: reference.value })
        return false
      })
      for (const { node, value } of references) {
        node.nodes = [
          {
            type: 'string',
            quote: '"',
            value: await this.embed(value, base),
            sourceIndex: 0,
            sourceEndIndex: 0,
          },
        ]
      }
      declaration.value = parsed.toString()
    }
    return root.toString()
  }

  async javascript(code: string, parseJavaScript: (code: string) => unknown) {
    const edits: { start: number, end: number, value: string, kind: string }[] = []
    function visit(node: unknown, context = '') {
      if (!node || typeof node !== 'object')
        return
      const record = node as Record<string, unknown>
      if (record.type === 'Property' || record.type === 'ObjectProperty') {
        const key = record.key as { name?: string, value?: string }
        visit(record.value, String(key.name || key.value || ''))
        return
      }
      let value = record.value
      if (record.type === 'TemplateLiteral' && Array.isArray(record.expressions) && !record.expressions.length) {
        const quasis = record.quasis as { value: { cooked: string } }[]
        value = quasis[0].value.cooked
      }
      if ((record.type === 'Literal' || record.type === 'StringLiteral' || record.type === 'TemplateLiteral') && typeof value === 'string') {
        const kind = context.toLowerCase() === 'srcset'
          ? 'srcset'
          : /^(?:background|backgroundImage|background-image|maskImage|mask-image)$/.test(context) && /url\(/i.test(value)
            ? 'css'
            : ['src', 'poster'].includes(context) && (RE_ASSET.test(value) || RE_REMOTE.test(value))
                ? 'resource'
                : 'asset'
        if (kind !== 'asset' || (RE_ASSET.test(value) && !RE_REMOTE.test(value)) || RE_TOKEN.test(value)) {
          edits.push({
            start: record.start as number,
            end: record.end as number,
            value,
            kind,
          })
        }
        return
      }
      for (const child of Object.values(record)) {
        if (Array.isArray(child))
          child.forEach(child => visit(child))
        else if (child && typeof child === 'object')
          visit(child)
      }
    }
    visit(parseJavaScript(code))
    const result = new MagicString(code)
    for (const edit of edits) {
      let token: string
      try {
        if (edit.kind === 'srcset') {
          const candidates = await Promise.all(parseSrcset(edit.value).map(async candidate => ({ ...candidate, url: await this.embed(candidate.url) })))
          token = stringifySrcset(candidates)
        }
        else if (edit.kind === 'css') {
          const css = await this.css(`a{background:${edit.value}}`)
          token = css.slice(css.indexOf(':') + 1, css.lastIndexOf('}'))
        }
        else {
          token = await this.embed(edit.value)
        }
      }
      catch (error) {
        if (edit.kind === 'asset' && error instanceof Error && error.message.includes('Standalone asset not found:'))
          continue
        throw error
      }
      const match = RE_TOKEN.exec(token)
      if (match)
        result.overwrite(edit.start, edit.end, `(globalThis.__slidev_assets[${match[1]}]+${JSON.stringify(match[2] || '')})`)
      else if (token.includes('slidev-asset:'))
        result.overwrite(edit.start, edit.end, `(${JSON.stringify(token)}.replace(/slidev-asset:(\\d+)/g,(_,index)=>globalThis.__slidev_assets[Number(index)]))`)
      else if (token !== edit.value)
        result.overwrite(edit.start, edit.end, JSON.stringify(token))
    }
    return result.toString()
  }

  async html(source: string, parseJavaScript: (code: string) => unknown) {
    const payloads = [
      ...source.matchAll(RE_DATA),
    ]
    for (const match of payloads)
      source = source.replace(match[0], await this.embed(match[0]))
    const document = parse(source)
    let body: HtmlElement | undefined
    const visit = async (node: HtmlNode) => {
      if (node.nodeName === '#text' && 'value' in node && !['script', 'style'].includes('parentNode' in node && node.parentNode && 'tagName' in node.parentNode
        ? node.parentNode.tagName
        : '')) {
        node.value = node.value.replace(/slidev-asset:(\d+)/g, (_, index) => {
          const asset = this.assets[Number(index)]
          return `data:${asset.type};base64,${asset.encoded}`
        })
      }
      if ('tagName' in node) {
        const attribute = (name: string) => node.attrs.find(attr => attr.name === name)
        if (node.tagName === 'body')
          body = node
        if (node.tagName === 'base' || (node.tagName === 'meta' && attribute('http-equiv')?.value.toLowerCase() === 'content-security-policy'))
          throw new Error('[slidev] Standalone HTML cannot preserve a custom base or Content-Security-Policy meta tag')
        if (node.tagName === 'link' && [
          'preload',
          'modulepreload',
          'preconnect',
          'dns-prefetch',
          'manifest',
        ].includes(attribute('rel')?.value || '')) {
          node.attrs = []
        }
        if (node.tagName === 'link' && attribute('rel')?.value === 'stylesheet') {
          const href = attribute('href')?.value
          if (href && !(this.options.allowRemote && RE_REMOTE.test(href))) {
            const resource = await this.read(href)
            const code = await this.css(Buffer.from(resource.bytes).toString('utf8'), resource.name)
            node.tagName = 'style'
            node.nodeName = 'style'
            node.attrs = []
            node.childNodes = [
              { nodeName: '#text', value: code, parentNode: node },
            ]
          }
        }
        for (const attr of node.attrs) {
          if (attr.name === 'srcdoc' || (attr.name === 'data' && node.tagName === 'object' && !(this.options.allowRemote && RE_REMOTE.test(attr.value))))
            throw new Error('[slidev] Embedded documents are not supported in standalone HTML')
          if (attr.name === 'data' && node.tagName === 'object')
            attr.value = await this.embed(attr.value)
          if (attr.name === 'style') {
            const styled = await this.css(`a{${attr.value}}`)
            attr.value = styled.slice(styled.indexOf('{') + 1, styled.lastIndexOf('}'))
          }
          else if (attr.name === 'srcset') {
            const candidates = parseSrcset(attr.value)
            const embedded = await Promise.all(candidates.map(async candidate => ({ ...candidate, url: await this.embed(candidate.url) })))
            attr.value = stringifySrcset(embedded)
          }
          else if (attr.name === 'src' || attr.name === 'poster' || (attr.name === 'href' && node.tagName !== 'a')) {
            if (['iframe', 'script', 'embed', 'object'].includes(node.tagName) && !attr.value.startsWith('data:') && !(this.options.allowRemote && RE_REMOTE.test(attr.value)))
              throw new Error(`[slidev] External ${node.tagName} is not supported in standalone HTML: ${attr.value}`)
            attr.value = await this.embed(attr.value)
          }
        }
        if (node.tagName === 'style') {
          for (const child of node.childNodes) {
            if (child.nodeName === '#text' && 'value' in child)
              child.value = await this.css(child.value)
          }
          node.attrs.push({ name: 'type', value: 'text/plain' }, { name: 'data-slidev-assets', value: '' })
        }
        if (node.tagName === 'script' && attribute('type')?.value === 'module') {
          for (const child of node.childNodes) {
            if (child.nodeName === '#text' && 'value' in child)
              child.value = await this.javascript(child.value, parseJavaScript)
          }
        }
      }
      for (const child of children(node))
        await visit(child)
    }
    await visit(document)
    const table = JSON.stringify(this.assets.map(({ type, encoded }) => [type, encoded]))
    const bootstrap = `const urls=${table}.map(([type,encoded])=>URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],{type})));Object.defineProperty(globalThis,'__slidev_assets',{value:Object.freeze(urls)});const replace=value=>value.replace(/slidev-asset:(\\d+)/g,(_,index)=>urls[Number(index)]);for(const element of document.querySelectorAll('*')){for(const attr of [...element.attributes]){if(attr.value.includes('slidev-asset:'))element.setAttribute(attr.name,replace(attr.value))}if(element.matches('style[data-slidev-assets]')){element.textContent=replace(element.textContent);element.type='text/css';element.removeAttribute('data-slidev-assets')}}`
    const fragment = parseFragment(`<script>${bootstrap}</script>`)
    if (!body)
      throw new Error('[slidev] Standalone HTML has no body')
    for (const child of fragment.childNodes) {
      child.parentNode = body
      body.childNodes.push(child)
    }
    return serialize(document)
  }
}

export function createSingleFilePlugins(options: ResolvedSlidevOptions, settings: HtmlExportOptions = {}, onAssets?: (assets: HtmlAsset[]) => void): PluginOption[] {
  for (const slide of options.data?.slides || [])
    assertStandaloneContent(slide.content, settings.allowRemote)
  const files = new Map<string, Uint8Array>()
  const packager = new HtmlAssetPackager({
    roots: options.roots,
    publicRoots: [
      {
        prefix: '',
        root: resolve(options.userRoot, 'public'),
      },
      ...[
        ...options.addonRoots,
        ...options.themeRoots,
      ].reverse().map(root => ({
        prefix: 'theme/',
        root: resolve(root, 'public'),
      })),
    ],
    files,
    images: settings.images,
    allowRemote: settings.allowRemote,
  })
  return [
    viteSingleFile(),
    {
      name: 'slidev:singlefile',
      enforce: 'post',
      config: () => ({
        build: { assetsInlineLimit: 0, cssCodeSplit: false, sourcemap: false },
      }),
      buildStart() {
        if (settings.allowRemote)
          this.warn('[slidev] HTML allowRemote is enabled. Retained online resources and embeds require connectivity; this export is not guaranteed offline.')
      },
      outputOptions: output => ({ ...output, manualChunks: undefined }),
      generateBundle: {
        order: 'post',
        async handler(_output, bundle) {
          for (const item of Object.values(bundle)) {
            if (/\.[cm]?js$/.test(item.fileName))
              throw new Error(`[slidev] Standalone export contains an unresolved JavaScript resource: ${item.fileName}`)
            if (item.type === 'asset' && !item.fileName.endsWith('.html')) {
              files.set(item.fileName, typeof item.source === 'string'
                ? Buffer.from(item.source)
                : item.source)
            }
            else if (item.type === 'chunk') {
              throw new Error(`[slidev] Standalone export contains an unresolved JavaScript chunk: ${item.fileName}`)
            }
          }
          for (const item of Object.values(bundle)) {
            if (item.type === 'asset' && item.fileName.endsWith('.html'))
              item.source = await packager.html(String(item.source), code => this.parse(code))
          }
          onAssets?.(packager.assets)
        },
      },
    },
  ]
}

import type { ResolvedFontOptions, SourceSlideInfo } from '@slidev/types'
import type MarkdownExit from 'markdown-exit'
import type { Connect, GeneralImportGlobOptions } from 'vite'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { slash } from '@antfu/utils'
import { createJiti } from 'jiti'
import { dirname, join, relative, win32 } from 'pathe'
import YAML from 'yaml'
import { toAtFS } from './resolver'
import { isAllowedFile } from './vite/importGuard'

/**
 * Whether `filePath` resolves inside any of `roots` (no `..` escape). Shared
 * containment predicate reused by the snippet (`<<<`) and `src:` deck-file
 * reads, and by the Vite slide-import guard (`isAllowedFile`).
 */
export function isPathInsideRoots(filePath: string, roots: string[]): boolean {
  return isAllowedFile(filePath, roots)
}

const RE_WHITESPACE_ONLY = /^\s*$/
const RE_QUOTED_STRING = /^(['"])(.*)\1$/
const RE_WHITESPACE = /\s+/g
const RE_WINDOWS_DRIVE = /^[A-Z]:\//i

type Token = ReturnType<MarkdownExit['parseInline']>[number]

type Jiti = ReturnType<typeof createJiti>
let jiti: Jiti | undefined
export function loadModule<T = unknown>(absolutePath: string): Promise<T> {
  jiti ??= createJiti(fileURLToPath(import.meta.url), {
    // Allows changes to take effect
    moduleCache: false,
  })
  return jiti.import(absolutePath) as Promise<T>
}

export function stringifyMarkdownTokens(tokens: Token[]) {
  return tokens.map(token => token.children
    ?.filter(t => ['text', 'code_inline'].includes(t.type) && !t.content.match(RE_WHITESPACE_ONLY))
    .map(t => t.content.trim())
    .join(' '))
    .filter(Boolean)
    .join(' ')
}

export function generateFontParams(options: ResolvedFontOptions) {
  const weights = options.weights
    .flatMap(i => options.italic ? [`0,${i}`, `1,${i}`] : [`${i}`])
    .sort()
    .join(';')
  const fontParams = options.webfonts
    .map(i => `family=${i.replace(RE_QUOTED_STRING, '$1').replace(RE_WHITESPACE, '+')}:${options.italic ? 'ital,' : ''}wght@${weights}`)
    .join('&')
  return fontParams
}

export function generateGoogleFontsUrl(options: ResolvedFontOptions) {
  return `https://fonts.googleapis.com/css2?${generateFontParams(options)}&display=swap`
}

export function generateCoollabsFontsUrl(options: ResolvedFontOptions) {
  return `https://api.fonts.coollabs.io/fonts?${generateFontParams(options)}&display=swap`
}

/**
 * Update frontmatter patch and preserve the comments
 */
export function updateFrontmatterPatch(source: SourceSlideInfo, frontmatter: Record<string, any>) {
  let doc = source.frontmatterDoc
  if (!doc) {
    source.frontmatterStyle = 'frontmatter'
    source.frontmatterDoc = doc = new YAML.Document({})
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    source.frontmatter[key] = value
    if (value == null) {
      doc.delete(key)
    }
    else {
      const valueNode = doc.createNode(value)
      let found = false
      YAML.visit(doc.contents, {
        Pair(_key, node, path) {
          if (path.length === 1 && YAML.isScalar(node.key) && node.key.value === key) {
            node.value = valueNode
            found = true
            return YAML.visit.BREAK
          }
        },
      })
      if (!found) {
        if (!YAML.isMap(doc.contents))
          doc.contents = doc.createNode({})
        doc.contents.add(
          doc.createPair(key, valueNode),
        )
      }
    }
  }
}

export function getBodyJson(req: Connect.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) || {})
      }
      catch (e) {
        reject(e)
      }
    })
  })
}

function getImportGlobRelativePath(from: string, to: string) {
  const normalizedFrom = slash(from)
  const normalizedTo = slash(to)
  return slash(
    RE_WINDOWS_DRIVE.test(normalizedFrom) || RE_WINDOWS_DRIVE.test(normalizedTo)
      ? win32.relative(normalizedFrom, normalizedTo)
      : relative(normalizedFrom, normalizedTo),
  )
}

function resolveImportGlobProxyModule(proxyBase: string, content: string) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 10)
  return `${proxyBase}.${hash}.ts`
}

export function createMakeAbsoluteImportGlob(baseRoot: string) {
  const proxyModules = new Map<string, string>()
  const proxyBasename = 'node_modules/.slidev/virtual/import-glob'
  const proxyBase = slash(join(baseRoot, proxyBasename))

  return function makeAbsoluteImportGlob(
    globs: string[],
    options: Partial<GeneralImportGlobOptions> = {},
  ) {
    // Vite does not treat /@slidev/* as a real filesystem importer. Emit
    // import.meta.glob from a proxy file so Vite resolves imports from disk.
    const content = `export default ${makeAbsoluteImportGlobExpression(dirname(proxyBase), globs, options)}\n`
    const proxyModule = resolveImportGlobProxyModule(proxyBase, content)
    if (proxyModules.get(proxyModule) !== content) {
      mkdirSync(dirname(proxyModule), { recursive: true })
      writeFileSync(proxyModule, content, 'utf-8')
      proxyModules.set(proxyModule, content)
    }
    return toAtFS(proxyModule)
  }
}

export type MakeAbsoluteImportGlob = ReturnType<typeof createMakeAbsoluteImportGlob>

function makeAbsoluteImportGlobExpression(
  self: string,
  globs: string[],
  options: Partial<GeneralImportGlobOptions> = {},
) {
  const relativeGlobs = globs.map((glob) => {
    const relativeGlob = getImportGlobRelativePath(self, glob)
    return !relativeGlob.startsWith('.') && !RE_WINDOWS_DRIVE.test(relativeGlob)
      ? `./${relativeGlob}`
      : relativeGlob
  })
  const opts: GeneralImportGlobOptions = {
    eager: true,
    exhaustive: true,
    ...options,
  }
  return `import.meta.glob(${JSON.stringify(relativeGlobs)}, ${JSON.stringify(opts)})`
}

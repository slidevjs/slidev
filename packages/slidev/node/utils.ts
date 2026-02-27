import type { ResolvedFontOptions, SourceSlideInfo } from '@slidev/types'
import type MarkdownExit from 'markdown-exit'
import type { Connect, GeneralImportGlobOptions } from 'vite'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slash } from '@antfu/utils'
import { createJiti } from 'jiti'
import YAML from 'yaml'

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
    ?.filter(t => ['text', 'code_inline'].includes(t.type) && !t.content.match(/^\s*$/))
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
    .map(i => `family=${i.replace(/^(['"])(.*)\1$/, '$1').replace(/\s+/g, '+')}:${options.italic ? 'ital,' : ''}wght@${weights}`)
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

export function makeAbsoluteImportGlob(
  userRoot: string,
  globs: string[],
  options: Partial<GeneralImportGlobOptions> = {},
) {
  // Vite's import.meta.glob only supports relative paths
  const relativeGlobs = globs.map(glob => `./${slash(relative(userRoot, glob))}`)
  const opts: GeneralImportGlobOptions = {
    eager: true,
    exhaustive: true,
    base: '/',
    ...options,
  }
  return `import.meta.glob(${JSON.stringify(relativeGlobs)}, ${JSON.stringify(opts)})`
}

import { fileURLToPath } from 'node:url'
import type { Token } from 'markdown-it'
import type { ResolvedFontOptions, SlideInfo } from '@slidev/types'
import YAML from 'yaml'
import type { JITI } from 'jiti'
import createJiti from 'jiti'
import type { Connect } from 'vite'

let jiti: JITI | undefined
export function loadModule(absolutePath: string) {
  jiti ??= createJiti(fileURLToPath(import.meta.url))
  return jiti(absolutePath)
}

export function stringifyMarkdownTokens(tokens: Token[]) {
  return tokens.map(token => token.children
    ?.filter(t => ['text', 'code_inline'].includes(t.type) && !t.content.match(/^\s*$/))
    .map(t => t.content.trim())
    .join(' '))
    .filter(Boolean)
    .join(' ')
}

export function generateGoogleFontsUrl(options: ResolvedFontOptions) {
  const weights = options.weights
    .flatMap(i => options.italic ? [`0,${i}`, `1,${i}`] : [`${i}`])
    .sort()
    .join(';')
  const fonts = options.webfonts
    .map(i => `family=${i.replace(/^(['"])(.*)\1$/, '$1').replace(/\s+/g, '+')}:${options.italic ? 'ital,' : ''}wght@${weights}`)
    .join('&')

  return `https://fonts.googleapis.com/css2?${fonts}&display=swap`
}

/**
 * Update frontmatter patch and preserve the comments
 */
export function updateFrontmatterPatch(slide: SlideInfo, frontmatter: Record<string, any>) {
  const source = slide.source
  let doc = source.frontmatterDoc
  if (!doc) {
    source.frontmatterStyle = 'frontmatter'
    source.frontmatterDoc = doc = new YAML.Document({})
  }
  for (const [key, value] of Object.entries(frontmatter)) {
    slide.frontmatter[key] = source.frontmatter[key] = value
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

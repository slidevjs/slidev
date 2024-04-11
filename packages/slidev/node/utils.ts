import type { Token } from 'markdown-it'
import type { ResolvedFontOptions, SlideInfo } from '@slidev/types'
import YAML from 'yaml'

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

export function updateDragPos(slide: SlideInfo, dragPos: Record<string, string>) {
  const source = slide.source
  slide.frontmatter.dragPos = source.frontmatter.dragPos = dragPos
  let doc = source.frontmatterDoc
  if (!doc) {
    source.frontmatterStyle = 'frontmatter'
    source.frontmatterDoc = doc = new YAML.Document({})
  }
  const valueNode = doc.createNode(dragPos)
  let found = false
  YAML.visit(doc.contents, {
    Pair(_key, node, path) {
      if (path.length === 1 && YAML.isScalar(node.key) && node.key.value === 'dragPos') {
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
      doc.createPair('dragPos', valueNode),
    )
  }
}

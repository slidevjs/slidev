import type { Element } from 'hast'
import type { ShikiTransformer } from 'shiki'

const FLAG_NAME = '__SLIDEV_FEATURE_TWOSLASH_AUTOSHOW__'

function applyAutoShowFlag(node: Element | undefined) {
  if (!node)
    return

  if (node.tagName === 'v-menu') {
    const properties = node.properties || (node.properties = {})
    if (properties[':shown'] === 'true')
      properties[':shown'] = FLAG_NAME
  }

  const children = Array.isArray(node.children) ? node.children : []
  for (const child of children) {
    if (child && typeof child === 'object' && 'type' in child && child.type === 'element')
      applyAutoShowFlag(child as Element)
  }
}

/**
 * Custom Twoslash transformer that rewrites the shown binding to use the build-time flag.
 */
export function transformerTwoslashConditional(): ShikiTransformer {
  return {
    name: 'slidev:twoslash-conditional',
    code(codeEl) {
      applyAutoShowFlag(codeEl as Element)
    },
  }
}

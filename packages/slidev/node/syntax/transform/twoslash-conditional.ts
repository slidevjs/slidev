import type { Element } from 'hast'
import type { ShikiTransformer } from 'shiki'

export function transformerTwoslashConditional(): ShikiTransformer {
  function applyConditionalFlag(node: Element) {
    if (node.tagName === 'v-menu') {
      if (node.properties?.class === 'twoslash-hover' && node.properties[':shown'] === 'true')
        node.properties[':shown'] = '$nav.currentPage === $page'
    }
    else {
      for (const child of node.children) {
        if (child.type === 'element')
          applyConditionalFlag(child)
      }
    }
  }

  return {
    name: 'slidev:twoslash-conditional',
    code: applyConditionalFlag,
  }
}

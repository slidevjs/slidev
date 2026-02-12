import type { MarkdownTransformContext } from '@slidev/types'

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const rawContentTags = new Set([
  'pre',
  'code',
  'script',
  'style',
  'textarea',
])

const openTagRE = /^\s*<([A-Z][\w:-]*)(?:\s[^>]*)?>\s*$/i
const closeTagRE = /^\s*<\/([A-Z][\w:-]*)\s*>\s*$/i
const listMarkerRE = /^(\s*)(?:[-+*]|\d{1,9}[.)])\s+/

interface HtmlStackItem {
  tag: string
  indent: number
}

function countIndent(input: string): number {
  let count = 0
  for (const ch of input) {
    if (ch === ' ')
      count += 1
    else if (ch === '\t')
      count += 2
    else
      break
  }
  return count
}

function repeatSpaces(length: number) {
  return ' '.repeat(Math.max(length, 0))
}

function matchFence(line: string): { char: '`' | '~', size: number } | null {
  const trimmed = line.trimStart()
  if (!trimmed)
    return null
  if (trimmed.startsWith('```')) {
    const match = trimmed.match(/^`{3,}/)
    return match ? { char: '`', size: match[0].length } : null
  }
  if (trimmed.startsWith('~~~')) {
    const match = trimmed.match(/^~{3,}/)
    return match ? { char: '~', size: match[0].length } : null
  }
  return null
}

/**
 * Workaround for prettier-plugin-slidev removing indentation from lists inside HTML blocks.
 * This ensures lists inside HTML blocks maintain proper indentation to prevent Vue parse errors.
 *
 * Note: This is a workaround. The proper fix should be in prettier-plugin-slidev to preserve
 * indentation during formatting. This transformer ensures compatibility even when Prettier
 * removes the required indentation.
 *
 * @see https://github.com/slidevjs/slidev/issues/2337
 */
export function transformHtmlListIndent(ctx: MarkdownTransformContext) {
  const code = ctx.s.toString()
  if (!code.includes('<'))
    return

  const lines = code.split(/\r?\n/)
  const newline = code.includes('\r\n') ? '\r\n' : '\n'

  const stack: HtmlStackItem[] = []
  let fenceChar: '`' | '~' | null = null
  let fenceSize = 0
  let changed = false
  let hasVueComponentAfterLastHtml = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    const fenceMatch = matchFence(line)
    if (fenceMatch) {
      if (fenceChar === null) {
        fenceChar = fenceMatch.char
        fenceSize = fenceMatch.size
      }
      else if (fenceMatch.char === fenceChar && fenceMatch.size >= fenceSize) {
        fenceChar = null
        fenceSize = 0
      }
      continue
    }

    if (fenceChar)
      continue

    if (!trimmed) {
      continue
    }

    const closeMatch = closeTagRE.exec(trimmed)
    if (closeMatch) {
      const tagName = closeMatch[1].toLowerCase()
      // Check if this is a Vue component closing tag
      const isVueComponent = tagName.startsWith('v-') || tagName === 'template'
      if (isVueComponent) {
        hasVueComponentAfterLastHtml = false
        continue
      }
      for (let idx = stack.length - 1; idx >= 0; idx--) {
        if (stack[idx].tag === tagName) {
          stack.splice(idx)
          break
        }
      }
      continue
    }

    if (trimmed.startsWith('<!--'))
      continue

    const openMatch = openTagRE.exec(trimmed)
    if (openMatch) {
      const tagName = openMatch[1]
      const tagNameLower = tagName.toLowerCase()
      // Skip Vue components (v-*), PascalCase components, and template tags
      const isPascalCase = tagName.length > 1 && tagName[0] >= 'A' && tagName[0] <= 'Z' && tagName[1] >= 'a' && tagName[1] <= 'z'
      if (tagNameLower.startsWith('v-') || isPascalCase || tagNameLower === 'template') {
        hasVueComponentAfterLastHtml = true
        continue
      }
      if (!voidTags.has(tagNameLower) && !trimmed.endsWith('/>')) {
        hasVueComponentAfterLastHtml = false
        stack.push({
          tag: tagNameLower,
          indent: countIndent(line),
        })
      }
      continue
    }

    if (!stack.length)
      continue

    if (stack.some(item => rawContentTags.has(item.tag)))
      continue

    // Skip lists if there's a Vue component after the last HTML tag
    if (hasVueComponentAfterLastHtml)
      continue

    const listMatch = listMarkerRE.exec(line)
    if (!listMatch)
      continue

    const currentIndent = countIndent(listMatch[1])
    const baseIndent = stack.at(-1)!.indent
    const targetIndent = Math.max(baseIndent, 2)

    if (currentIndent >= targetIndent)
      continue

    const content = line.slice(listMatch[1].length)
    lines[i] = `${repeatSpaces(targetIndent)}${content}`
    changed = true
  }

  if (!changed)
    return

  ctx.s.overwrite(0, code.length, lines.join(newline))
}

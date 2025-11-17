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

  const char = trimmed[0]
  if (char !== '`' && char !== '~')
    return null

  let size = 1
  while (size < trimmed.length && trimmed[size] === char)
    size++

  if (size < 3)
    return null

  return { char, size }
}

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    const fenceMatch = matchFence(line)
    if (fenceMatch) {
      const currentFenceChar = fenceMatch.char
      if (fenceChar === null) {
        fenceChar = currentFenceChar
        fenceSize = fenceMatch.size
      }
      else if (currentFenceChar === fenceChar && fenceMatch.size >= fenceSize) {
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
      const tagName = openMatch[1].toLowerCase()
      if (!voidTags.has(tagName) && !trimmed.endsWith('/>')) {
        stack.push({
          tag: tagName,
          indent: countIndent(line),
        })
      }
      continue
    }

    if (!stack.length)
      continue

    if (stack.some(item => rawContentTags.has(item.tag)))
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

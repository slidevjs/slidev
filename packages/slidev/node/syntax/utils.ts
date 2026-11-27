export function normalizeRangeStr(rangeStr = '') {
  return !rangeStr.trim()
    ? []
    : rangeStr.trim().split(/\|/g).map(i => i.trim())
}
/**
 * Escape `{{` in code block to prevent Vue interpret it, #99, #1316
 */
export function escapeVueInCode(md: string) {
  return md.replace(/\{\{/g, '&lbrace;&lbrace;')
}

export function extractBracedExpression(input: string): string | undefined {
  const start = input.indexOf('{')
  if (start === -1)
    return

  let depth = 0
  let quote: string | undefined
  let escaped = false

  for (let i = start; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      if (escaped)
        escaped = false
      else if (char === '\\')
        escaped = true
      else if (char === quote)
        quote = undefined
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
    }
    else if (char === '{') {
      depth++
    }
    else if (char === '}') {
      depth--
      if (depth === 0)
        return input.slice(start, i + 1)
    }
  }
}

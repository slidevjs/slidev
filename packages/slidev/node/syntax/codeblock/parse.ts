export interface ParsedCodeblockInfo {
  lang: string
  title: string
  rangeStr: string
  options?: string
  rest: string
}

export const RE_BLOCK_INFO_PREFIX = /^([\w'#+-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w,|\-*]+)\})?/

/**
 * Extracts a balanced brace block `{...}` starting at the first non-whitespace character.
 * Supports string literals (`"..."`, `'...'`, `` `...` ``) and escaped characters.
 */
export function extractBalancedBlock(input: string, open = '{', close = '}'): {
  start: number
  end: number
  body: string
  rest: string
} | undefined {
  const start = input.search(/\S/)
  if (start === -1 || input[start] !== open)
    return

  let depth = 0
  let quote: string | undefined
  let escaped = false

  for (let i = start; i < input.length; i++) {
    const char = input[i]

    if (quote) {
      if (escaped) {
        escaped = false
      }
      else if (char === '\\') {
        escaped = true
      }
      else if (char === quote) {
        quote = undefined
      }
      continue
    }

    if (char === '"' || char === '\'' || char === '`') {
      quote = char
    }
    else if (char === open) {
      depth++
    }
    else if (char === close && --depth === 0) {
      return {
        start,
        end: i,
        body: input.slice(start, i + 1),
        rest: input.slice(i + 1),
      }
    }
  }
}

export function parseCodeblockInfo(info: string): ParsedCodeblockInfo {
  const match = info.match(RE_BLOCK_INFO_PREFIX)
  if (!match) {
    return {
      lang: '',
      title: '',
      rangeStr: '',
      rest: '',
    }
  }

  const [, lang = '', title = '', rangeStr = ''] = match
  const remainder = info.slice(match[0].length)
  const block = extractBalancedBlock(remainder)

  return {
    lang,
    title,
    rangeStr,
    options: block?.body,
    rest: block ? block.rest : remainder,
  }
}

export interface ParsedCodeblockInfo {
  lang: string
  title: string
  rangeStr: string
  options?: string
  rest: string
}

const RE_BLOCK_INFO_PREFIX = /^([\w'-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w,|\-*]+)\})?[ \t]*/

function findBalancedBlockEnd(input: string) {
  if (input[0] !== '{')
    return

  let depth = 0
  let quote: string | undefined
  let escaped = false

  for (let i = 0; i < input.length; i++) {
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

    if (char === '"' || char === '\'' || char === '`') {
      quote = char
    }
    else if (char === '{') {
      depth++
    }
    else if (char === '}' && --depth === 0) {
      return i
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
  const optionsEnd = findBalancedBlockEnd(remainder)

  if (optionsEnd == null) {
    return { lang, title, rangeStr, rest: remainder }
  }

  return {
    lang,
    title,
    rangeStr,
    options: remainder.slice(0, optionsEnd + 1),
    rest: remainder.slice(optionsEnd + 1),
  }
}

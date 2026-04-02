import { parseRangeString } from '@slidev/parser/core'

export function wordCount(str: string) {
  const pattern = /[\w`'\-\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = str.match(pattern)
  let count = 0
  if (!m)
    return 0
  for (let i = 0; i < m.length; i++) {
    if (m[i].charCodeAt(0) >= 0x4E00)
      count += m[i].length
    else
      count += 1
  }
  return count
}

export function makeId(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  return result.join('')
}

export function updateCodeHighlightRange(
  rangeStr: string,
  linesCount: number,
  startLine: number,
  getTokenOfLine: (line: number) => Element[],
) {
  const highlights: number[] = parseRangeString(linesCount + startLine - 1, rangeStr)
  for (let line = 0; line < linesCount; line++) {
    const tokens = getTokenOfLine(line)
    const isHighlighted = highlights.includes(line + startLine)
    for (const token of tokens) {
      // token.classList.toggle(CLASS_VCLICK_TARGET, true)
      token.classList.toggle('slidev-code-highlighted', isHighlighted)
      token.classList.toggle('slidev-code-dishonored', !isHighlighted)

      // for backward compatibility
      token.classList.toggle('highlighted', isHighlighted)
      token.classList.toggle('dishonored', !isHighlighted)
    }
  }
}

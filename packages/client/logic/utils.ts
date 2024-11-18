import { parseRangeString } from '@slidev/parser/core'

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

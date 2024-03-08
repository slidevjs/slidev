import { parseRangeString } from '@slidev/parser/core'
import { useTimestamp } from '@vueuse/core'
import { computed, ref } from 'vue'

export function useTimer() {
  const tsStart = ref(Date.now())
  const now = useTimestamp({
    interval: 1000,
  })
  const timer = computed(() => {
    const passed = (now.value - tsStart.value) / 1000
    const sec = Math.floor(passed % 60).toString().padStart(2, '0')
    const min = Math.floor(passed / 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  })
  function resetTimer() {
    tsStart.value = now.value
  }

  return {
    timer,
    resetTimer,
  }
}

export function makeId(length = 5) {
  const result = []
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  return result.join('')
}

/**
 *   '+3' => '+3'
 *   '-3' => '-3'
 *    '3' => 3
 *      3 => 3
 */
export function normalizeAtProp(at: string | number = '+1'): [isRelative: boolean, value: number] {
  let n = +at
  if (Number.isNaN(n)) {
    console.warn('[slidev] Invalid click position:', at)
    n = 0
  }
  return [
    typeof at === 'string' && '+-'.includes(at[0]),
    n,
  ]
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

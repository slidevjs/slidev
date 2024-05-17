export function normalizeRangeStr(rangeStr = '') {
  return !rangeStr.trim() ? [] : rangeStr.trim().split(/\|/g).map(i => i.trim())
}

export function getCodeBlocks(md: string) {
  const codeblocks = Array
    // eslint-disable-next-line regexp/no-contradiction-with-assertion
    .from(md.matchAll(/^```[\s\S]*?^```/gm))
    .map((m) => {
      const start = m.index!
      const end = m.index! + m[0].length
      const startLine = md.slice(0, start).match(/\n/g)?.length || 0
      const endLine = md.slice(0, end).match(/\n/g)?.length || 0
      return [start, end, startLine, endLine]
    })

  return {
    codeblocks,
    isInsideCodeblocks(idx: number) {
      return codeblocks.some(([s, e]) => s <= idx && idx <= e)
    },
    isLineInsideCodeblocks(line: number) {
      return codeblocks.some(([, , s, e]) => s <= line && line <= e)
    },
  }
}

/**
 * Escape `{{` in code block to prevent Vue interpret it, #99, #1316
 */
export function escapeVueInCode(md: string) {
  return md.replace(/\{\{/g, '&lbrace;&lbrace;')
}

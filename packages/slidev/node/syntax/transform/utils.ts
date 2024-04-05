export function normalizeRangeStr(rangeStr = '') {
  return !rangeStr.trim() ? [] : rangeStr.trim().split(/\|/g).map(i => i.trim())
}

/**
 * Escape `{{` in code block to prevent Vue interpret it, #99, #1316
 */
export function escapeVueInCode(md: string) {
  return md.replace(/{{/g, '&lbrace;&lbrace;')
}

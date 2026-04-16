import type { MarkdownExit } from 'markdown-exit'

const RE_SLOT_MARKER = /^::\s*([\w.\-:]+)\s*::\s*$/

export default function MarkdownItSlotSugar(md: MarkdownExit) {
  md.block.ruler.before('fence', 'slot_marker', (state, startLine, _endLine, silent) => {
    if (state.sCount[startLine] - state.blkIndent > 0)
      return false

    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const lineText = state.src.slice(pos, max)

    const match = lineText.match(RE_SLOT_MARKER)
    if (!match)
      return false

    if (silent)
      return true

    const token = state.push('slot_marker', '', 0)
    token.meta = { slotName: match[1] }
    token.map = [startLine, startLine + 1]

    state.line = startLine + 1
    state.env.hasSlotMarker = true

    return true
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] })

  md.core.ruler.push('slot_sugar_compiler', (state) => {
    if (!state.env.hasSlotMarker)
      return

    const tokens = state.tokens
    const newTokens = []
    let hasOpenSlot = false

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      if (token.type === 'slot_marker') {
        if (hasOpenSlot) {
          const closeHtml = new state.Token('html_block', '', 0)
          closeHtml.content = '\n</template>\n'
          newTokens.push(closeHtml)
        }

        const openHtml = new state.Token('html_block', '', 0)
        openHtml.content = `\n<template v-slot:${token.meta.slotName}="slotProps">\n`
        newTokens.push(openHtml)

        hasOpenSlot = true
      }
      else {
        newTokens.push(token)
      }
    }

    if (hasOpenSlot) {
      const closeHtml = new state.Token('html_block', '', 0)
      closeHtml.content = '\n</template>\n'
      newTokens.push(closeHtml)
    }

    state.tokens = newTokens
  })
}

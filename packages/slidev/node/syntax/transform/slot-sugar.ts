import type { MarkdownTransformContext } from '@slidev/types'
import { getCodeBlocks } from './utils'

export function transformSlotSugar(
  ctx: MarkdownTransformContext,
) {
  const linesWithNewline = ctx.s.original.split(/(\r?\n)/g)
  const codeBlocks = getCodeBlocks(ctx.s.original)

  const lines: string[] = []
  for (let i = 0; i < linesWithNewline.length; i += 2) {
    const line = linesWithNewline[i]
    const newline = linesWithNewline[i + 1] || ''
    lines.push(line + newline)
  }

  let prevSlot = false

  let offset = 0
  lines.forEach((line) => {
    const start = offset
    offset += line.length
    if (codeBlocks.isInsideCodeblocks(offset))
      return
    const match = line.match(/^::\s*([\w.\-:]+)\s*::(\s*)$/)
    if (match) {
      ctx.s.overwrite(start, offset - match[2].length, `${prevSlot ? '\n\n</template>\n' : '\n'}<template v-slot:${match[1]}="slotProps">\n`)
      prevSlot = true
    }
  })

  if (prevSlot)
    ctx.s.append('\n\n</template>')
}

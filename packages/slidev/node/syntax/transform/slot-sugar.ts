import { getCodeBlocks } from './utils'

export function transformSlotSugar(md: string) {
  const lines = md.split(/\r?\n/g)

  let prevSlot = false

  const { isLineInsideCodeblocks } = getCodeBlocks(md)

  lines.forEach((line, idx) => {
    if (isLineInsideCodeblocks(idx))
      return

    const match = line.trimEnd().match(/^::\s*([\w\.\-\:]+)\s*::$/)
    if (match) {
      lines[idx] = `${prevSlot ? '\n\n</template>\n' : '\n'}<template v-slot:${match[1]}="slotProps">\n`
      prevSlot = true
    }
  })

  if (prevSlot)
    lines[lines.length - 1] += '\n\n</template>'

  return lines.join('\n')
}

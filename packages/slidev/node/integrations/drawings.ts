import type { ResolvedSlidevOptions } from '@slidev/types'
import { basename, dirname, join, resolve } from 'node:path'
import fg from 'fast-glob'
import fs from 'fs-extra'

function resolveDrawingsDir(options: ResolvedSlidevOptions): string | undefined {
  return options.data.config.drawings.persist
    ? resolve(
      dirname(options.entry),
      options.data.config.drawings.persist,
    )
    : undefined
}

export async function loadDrawings(options: ResolvedSlidevOptions) {
  const dir = resolveDrawingsDir(options)
  if (!dir || !fs.existsSync(dir))
    return {}

  const files = await fg('*.svg', {
    onlyFiles: true,
    cwd: dir,
    absolute: true,
    suppressErrors: true,
  })

  const obj: Record<string, string> = {}
  await Promise.all(files.map(async (path) => {
    const num = +basename(path, '.svg')
    if (Number.isNaN(num))
      return
    const content = await fs.readFile(path, 'utf8')
    const lines = content.split(/\n/g)
    obj[num.toString()] = lines.slice(1, -1).join('\n')
  }))

  return obj
}

export async function writeDrawings(options: ResolvedSlidevOptions, drawing: Record<string, string>) {
  const dir = resolveDrawingsDir(options)
  if (!dir)
    return

  const width = options.data.config.canvasWidth
  const height = Math.round(width / options.data.config.aspectRatio)
  const SVG_HEAD = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`

  await fs.ensureDir(dir)

  return Promise.all(
    Object.entries(drawing).map(async ([key, value]) => {
      if (!value)
        return

      const svg = `${SVG_HEAD}\n${value}\n</svg>`
      await fs.writeFile(join(dir, `${key}.svg`), svg, 'utf-8')
    }),
  )
}

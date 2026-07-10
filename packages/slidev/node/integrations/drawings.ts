import type { ResolvedSlidevOptions } from '@slidev/types'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import fg from 'fast-glob'

/**
 * Whether `key` is a safe bare slide id that can be joined onto `dir` without
 * escaping it. `loadDrawings` only ever produces numeric keys, so writes
 * should only ever accept numeric keys too.
 */
export function isSafeDrawingKey(dir: string, key: string): boolean {
  if (!/^\d+$/.test(key))
    return false
  const target = join(dir, `${key}.svg`)
  const rel = relative(dir, target)
  return !rel.startsWith('..') && !isAbsolute(rel)
}

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
  if (!dir || !existsSync(dir))
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

  await fs.mkdir(dir, { recursive: true })

  return Promise.all(
    Object.entries(drawing).map(async ([key, value]) => {
      if (!value)
        return

      if (!isSafeDrawingKey(dir, key)) {
        console.warn(`[slidev] Ignoring drawing with unsafe key: ${key}`)
        return
      }

      const svg = `${SVG_HEAD}\n${value}\n</svg>`
      await fs.writeFile(join(dir, `${key}.svg`), svg, 'utf-8')
    }),
  )
}

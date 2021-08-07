import { dirname, resolve } from 'path'
import fs from 'fs-extra'
import { ResolvedSlidevOptions } from './options'

function resolveDrawingsPath(options: ResolvedSlidevOptions): string | undefined {
  if (options.data.config.persistDrawings === false)
    return undefined

  return options.data.config.persistDrawings === true
    ? resolve(dirname(options.entry), '.slidev/drawings.json')
    : options.data.config.persistDrawings
}

export async function loadDrawings(options: ResolvedSlidevOptions) {
  const path = resolveDrawingsPath(options)

  if (path && fs.existsSync(path))
    return await fs.readJson(path)
  else
    return {}
}

export async function writeDarwings(options: ResolvedSlidevOptions, drawing: any) {
  const path = resolveDrawingsPath(options)
  if (!path)
    return

  await fs.ensureDir(dirname(path))
  return await fs.writeJSON(path, drawing, { spaces: 2 })
}

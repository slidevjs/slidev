import type { ResolvedSlidevOptions } from '@slidev/types'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

function resolveSnapshotsDir(options: ResolvedSlidevOptions): string {
  return resolve(dirname(options.entry), '.slidev/snapshots')
}

export async function loadSnapshots(options: ResolvedSlidevOptions) {
  const dir = resolveSnapshotsDir(options)
  const file = join(dir, 'snapshots.json')
  if (!dir || !existsSync(file))
    return {}

  return JSON.parse(await fs.readFile(file, 'utf8'))
}

export async function writeSnapshots(options: ResolvedSlidevOptions, data: Record<string, any>) {
  const dir = resolveSnapshotsDir(options)
  if (!dir)
    return

  await fs.mkdir(dir, { recursive: true })
  // TODO: write as each image file
  await fs.writeFile(join(dir, 'snapshots.json'), JSON.stringify(data, null, 2), 'utf-8')
}

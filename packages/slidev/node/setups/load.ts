import type { Awaitable } from '@antfu/utils'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadModule } from '../utils'

export async function loadSetups<F extends (...args: any) => any>(
  roots: string[],
  filename: string,
  args: Parameters<F>,
  extraLoader?: (root: string) => ReturnType<F>[],
) {
  return await Promise.all(roots.flatMap((root) => {
    const tasks: Awaitable<ReturnType<F>>[] = []
    const path = resolve(root, 'setup', filename)
    if (existsSync(path)) {
      tasks.push(loadModule<{ default: F }>(path).then(mod => mod.default(...args)))
    }
    if (extraLoader) {
      tasks.push(...extraLoader(root))
    }
    return tasks
  }))
}

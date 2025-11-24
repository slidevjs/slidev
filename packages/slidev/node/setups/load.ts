import type { Awaitable } from '@antfu/utils'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { deepMergeWithArray } from '@antfu/utils'
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

export function mergeOptions<T, S extends Partial<T> = T>(
  base: T,
  options: S[],
  merger: (base: T, options: S) => T = deepMergeWithArray as any,
): T {
  return options.reduce((acc, cur) => merger(acc, cur), base)
}

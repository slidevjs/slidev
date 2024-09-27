import { resolve } from 'node:path'
import { deepMergeWithArray } from '@antfu/utils'
import fs from 'fs-extra'
import { loadModule } from '../utils'

export async function loadSetups<F extends (...args: any) => any>(
  roots: string[],
  filename: string,
  args: Parameters<F>,
  extraLoader?: (root: string) => Awaited<ReturnType<F>>[],
) {
  const returns: Awaited<ReturnType<F>>[] = []
  for (const root of roots) {
    const path = resolve(root, 'setup', filename)
    if (fs.existsSync(path)) {
      const { default: setup } = loadModule(path)
      const ret = await setup(...args)
      if (ret)
        returns.push(ret)
    }
    if (extraLoader)
      returns.push(...extraLoader(root))
  }
  return returns
}

export function mergeOptions<T, S extends Partial<T> = T>(
  base: T,
  options: S[],
  merger: (base: T, options: S) => T = deepMergeWithArray as any,
): T {
  return options.reduce((acc, cur) => merger(acc, cur), base)
}

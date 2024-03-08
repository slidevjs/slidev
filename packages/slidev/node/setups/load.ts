import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import { deepMergeWithArray } from '@antfu/utils'
import jiti from 'jiti'

export async function loadSetups<T, R extends object>(
  clientRoot: string,
  roots: string[],
  name: string,
  arg: T,
  initial: R,
  merge: boolean | ((a: R, o: R) => R) = true,
): Promise<R> {
  let returns = initial
  for (const root of [clientRoot, ...roots].reverse()) {
    const path = resolve(root, 'setup', name)
    if (fs.existsSync(path)) {
      const { default: setup } = jiti(fileURLToPath(import.meta.url))(path)
      const result = await setup(arg)
      if (result !== null) {
        returns = typeof merge === 'function'
          ? merge(returns, result)
          : merge
            ? deepMergeWithArray(returns, result)
            : result
      }
    }
  }
  return returns
}

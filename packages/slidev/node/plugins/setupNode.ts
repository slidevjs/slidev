import { resolve } from 'path'
import { existsSync } from 'fs-extra'
import { deepMerge } from '@antfu/utils'
import _jiti from 'jiti'

const jiti = _jiti(__filename)

export async function loadSetups<T, R extends object>(roots: string[], name: string, arg: T, initial: R, merge = true): Promise<R> {
  let returns = initial
  for (const root of roots) {
    const path = resolve(root, 'setup', name)
    if (existsSync(path)) {
      const { default: setup } = jiti(path)
      const result = await setup(arg)
      if (result !== null) {
        returns = merge
          ? deepMerge(returns, result)
          : result
      }
    }
  }
  return returns
}

import { Plugin } from 'vite'
import { objectEntries } from '@antfu/utils'
import { ResolvedSlidevOptions } from '../options'
import { getDefine } from './extendConfig'

export function createFixPlugins(
  options: ResolvedSlidevOptions,
): Plugin[] {
  const define = objectEntries(getDefine(options))
  return [
    {
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.vue')) {
          define.forEach(([from, to]) => {
            code = code.replaceAll(from, to)
          })
          return code
        }
      },
    },
  ]
}

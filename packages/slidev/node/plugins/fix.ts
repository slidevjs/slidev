import { Plugin } from 'vite'
import { ResolvedSlidevOptions } from '../options'

export function createFixPlugins(
  { mode }: ResolvedSlidevOptions,
): Plugin[] {
  const DEV = mode === 'dev' ? 'true' : 'false'

  return [
    {
      name: 'slidev:flags',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.vue'))
          return code.replace(/__DEV__/g, DEV)
      },
    },
    {
      name: 'slidev:vue-escape-post',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    },
  ]
}

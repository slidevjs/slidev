import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'

const RE_MONACO_BASE = /node_modules\/monaco-editor\/esm\/vs\/base/
const postfixRE = /[?#].*$/
function cleanUrl(url: string) {
  return url.replace(postfixRE, '')
}

/**
 * Temporary workaround for https://github.com/microsoft/monaco-editor/issues/4712
 */
export function createPatchMonacoSourceMapPlugin(
): Plugin {
  return {
    name: 'slidev:patch-monaco-sourcemap',
    enforce: 'pre',
    load: {
      filter: { id: RE_MONACO_BASE },
      handler(id) {
        if (!RE_MONACO_BASE.test(id))
          return
        return readFile(cleanUrl(id), 'utf-8')
      },
    },
  }
}

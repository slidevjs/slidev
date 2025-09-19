import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'

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
    load(id) {
      if (!id.includes('node_modules/monaco-editor/esm/vs/base'))
        return
      return readFile(cleanUrl(id), 'utf-8')
    },
  }
}

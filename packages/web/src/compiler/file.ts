// Ported from https://github.com/vuejs/repl/blob/main/src/transform.ts

import { compileMd } from './md'
import { transformTS } from './ts'
import { isJsLikeFile, isJsxFile, isTsFile } from './utils'
import { compileVue } from './vue'

export interface CompileResult {
  js?: string
  css?: string
  errors?: (string | Error)[]
}

export async function compileFile(filename: string, code: string): Promise<CompileResult> {
  if (!code.trim()) {
    return {}
  }

  if (filename.endsWith('.css')) {
    return {
      css: code,
    }
  }

  if (isJsLikeFile(filename)) {
    const isJSX = isJsxFile(filename)
    if (isTsFile(filename)) {
      code = await transformTS(code, isJSX)
    }
    if (isJSX) {
      code = await import('./jsx').then(m => m.transformJSX(code))
    }
    return {
      js: code,
    }
  }

  if (filename.endsWith('.json')) {
    let parsed
    try {
      parsed = JSON.parse(code)
    }
    catch (err: any) {
      console.error(`Error parsing ${filename}`, err.message)
      return {
        errors: [err.message],
      }
    }
    return {
      js: `export default ${JSON.stringify(parsed)}`,
    }
  }

  if (filename.endsWith('.vue')) {
    return compileVue(filename, code)
  }

  if (filename.endsWith('.md')) {
    return compileMd(filename, code)
  }
}

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

export async function compileFile(filepath: string, code: string): Promise<CompileResult> {
  if (!code.trim()) {
    return {}
  }

  if (filepath.endsWith('.css')) {
    return {
      css: code,
    }
  }

  if (isJsLikeFile(filepath)) {
    const isJSX = isJsxFile(filepath)
    if (isTsFile(filepath)) {
      code = await transformTS(code, isJSX)
    }
    if (isJSX) {
      code = await import('./jsx').then(m => m.transformJSX(code))
    }
    return {
      js: code,
    }
  }

  if (filepath.endsWith('.json')) {
    let parsed
    try {
      parsed = JSON.parse(code)
    }
    catch (err: any) {
      console.error(`Error parsing ${filepath}`, err.message)
      return {
        errors: [err.message],
      }
    }
    return {
      js: `export default ${JSON.stringify(parsed)}`,
    }
  }

  if (filepath.endsWith('.vue')) {
    return compileVue(filepath, code)
  }

  if (filepath.endsWith('.md')) {
    return compileMd(filepath, code)
  }

  return {
    errors: [`Unknown file extension for ${filepath}`],
  }
}

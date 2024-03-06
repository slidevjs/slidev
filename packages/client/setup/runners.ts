import { createSingletonPromise } from '@antfu/utils'
import type { CodeRunner, RunnerContext, RunnerOutput, RunnerTextOutput } from '@slidev/types'
import { isDark } from '../logic/dark'

export default createSingletonPromise(async () => {
  const runners: Record<string, CodeRunner> = {
    javascript: runJavaScript,
    typescript: runTypeScript,
  }

  const { shiki, themes } = await import('#slidev/shiki')
  const highlighter = await shiki
  const highlight = (code: string, lang: string) => highlighter.codeToHtml(code, {
    lang,
    theme: typeof themes === 'string'
      ? themes
      : isDark.value
        ? themes.dark || 'vitesse-dark'
        : themes.light || 'vitesse-light',
  })

  const run = async (code: string, lang: string, rawMode: boolean): Promise<RunnerOutput> => {
    try {
      const runner = runners[lang]
      if (!runner)
        throw new Error(`Runner for language "${lang}" not found`)
      return await runner(
        code,
        {
          highlight,
          run: (code, lang) => run(code, lang, rawMode),
          rawMode,
        },
      )
    }
    catch (e) {
      return {
        error: `${e}`,
      }
    }
  }

  // @ts-expect-error injected in runtime
  // eslint-disable-next-line unused-imports/no-unused-vars
  const injection_arg = undefined
  // eslint-disable-next-line prefer-const
  let injection_return: Record<string, CodeRunner> = {}

  /* __async_injections__ */

  Object.assign(runners, injection_return)

  return {
    highlight,
    run,
  }
})

// Ported from https://github.com/microsoft/TypeScript-Website/blob/v2/packages/playground/src/sidebar/runtime.ts
export async function runJavaScript(code: string) {
  const allLogs: RunnerTextOutput[] = []

  const replace = {} as any
  bindLoggingFunc(replace, 'log', 'LOG')
  bindLoggingFunc(replace, 'debug', 'DBG')
  bindLoggingFunc(replace, 'warn', 'WRN')
  bindLoggingFunc(replace, 'error', 'ERR')
  replace.info = replace.log
  replace.clear = () => allLogs.length = 0
  const vmConsole = Object.assign({}, console, replace)
  try {
    const safeJS = `return async (console) => {${sanitizeJS(code)}}`
    // eslint-disable-next-line no-new-func
    await (new Function(safeJS)())(vmConsole)
  }
  catch (error) {
    return {
      error: `ERROR: ${error}`,
    }
  }

  function bindLoggingFunc(obj: any, name: string, type: string) {
    obj[name] = function (...objs: any[]) {
      allLogs.push({ type, content: objs.map(printObject) })
    }
  }

  function printObject(arg: any) {
    if (typeof arg === 'string') {
      return {
        text: arg,
      }
    }
    return {
      text: objectToText(arg),
      highlightLang: 'javascript',
    }
  }

  function objectToText(arg: any): string {
    let textRep = ''
    if (arg instanceof Error) {
      textRep = `Error: ${JSON.stringify(arg.message)}`
    }
    else if (arg === null || arg === undefined || typeof arg === 'symbol') {
      textRep = String(arg)
    }
    else if (Array.isArray(arg)) {
      textRep = `[${arg.map(objectToText).join(', ')}]`
    }
    else if (arg instanceof Set) {
      const setIter = [...arg]
      textRep = `Set (${arg.size}) {${setIter.map(objectToText).join(', ')}}`
    }
    else if (arg instanceof Map) {
      const mapIter = [...arg.entries()]
      textRep
        = `Map (${arg.size}) {${mapIter
          .map(([k, v]) => `${objectToText(k)} => ${objectToText(v)}`)
          .join(', ')
        }}`
    }
    else if (arg instanceof RegExp) {
      textRep = arg.toString()
    }
    else if (typeof arg === 'string') {
      textRep = JSON.stringify(arg)
    }
    else if (typeof arg === 'object') {
      const name = arg.constructor?.name ?? ''
      // No one needs to know an obj is an obj
      const nameWithoutObject = name && name === 'Object' ? '' : name
      const prefix = nameWithoutObject ? `${nameWithoutObject}: ` : ''

      // JSON.stringify omits any keys with a value of undefined. To get around this, we replace undefined with the text __undefined__ and then do a global replace using regex back to keyword undefined
      textRep
        = prefix
        + JSON.stringify(arg, (_, value) => (value === undefined ? '__undefined__' : value), 2).replace(
          /"__undefined__"/g,
          'undefined',
        )

      textRep = String(textRep)
    }
    else {
      textRep = String(arg)
    }
    return textRep
  }

  // The reflect-metadata runtime is available, so allow that to go through
  function sanitizeJS(code: string) {
    return code.replace(`import "reflect-metadata"`, '').replace(`require("reflect-metadata")`, '')
  }

  return allLogs
}

let tsModule: typeof import('typescript') | undefined
export async function runTypeScript(code: string, context: RunnerContext) {
  const { transpile } = tsModule ??= await import('typescript')
  code = transpile(code, {
    module: tsModule.ModuleKind.ESNext,
    target: tsModule.ScriptTarget.ES2022,
  })
  return await context.run(code, 'javascript')
}

// Ported from https://github.com/microsoft/TypeScript-Website/blob/v2/packages/playground/src/sidebar/runtime.ts

export interface JavaScriptExecutionLog {
  type: string
  content: string[]
}

export async function runJavaScript(js: string): Promise<JavaScriptExecutionLog[]> {
  const allLogs: JavaScriptExecutionLog[] = []

  const rawConsole = console

  const replace = {} as any
  bindLoggingFunc(replace, rawConsole, 'log', 'LOG')
  bindLoggingFunc(replace, rawConsole, 'debug', 'DBG')
  bindLoggingFunc(replace, rawConsole, 'warn', 'WRN')
  bindLoggingFunc(replace, rawConsole, 'error', 'ERR')
  replace.info = replace.log
  replace.clear = () => allLogs.length = 0
  const vmConsole = Object.assign({}, rawConsole, replace)
  try {
    const safeJS = `return async (console) => {${sanitizeJS(js)}}`
    // eslint-disable-next-line no-new-func
    await (new Function(safeJS)())(vmConsole)
  }
  catch (error) {
    vmConsole.error(error)
  }

  function bindLoggingFunc(obj: any, raw: any, name: string, id: string) {
    obj[name] = function (...objs: any[]) {
      const output = objs.map(objectToText)
      allLogs.push({ type: id, content: output })
    }
  }

  function objectToText(arg: any): string {
    let textRep = ''
    if (arg && arg.stack && arg.message) {
      // special case for err
      textRep = arg.message
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
      textRep = `"${arg}"`
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

  return allLogs
}

// The reflect-metadata runtime is available, so allow that to go through
function sanitizeJS(code: string) {
  return code.replace(`import "reflect-metadata"`, '').replace(`require("reflect-metadata")`, '')
}

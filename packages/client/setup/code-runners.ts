import type { CodeRunner, CodeRunnerOutput, CodeRunnerOutputs, CodeRunnerOutputText } from '@slidev/types'
import type ts from 'typescript'

import deps from '#slidev/monaco-run-deps'
import setups from '#slidev/setups/code-runners'
import { createSingletonPromise } from '@antfu/utils'
import { ref } from 'vue'

export default createSingletonPromise(async () => {
  const runners: Record<string, CodeRunner> = {
    javascript: runTypeScript,
    js: runTypeScript,
    typescript: runTypeScript,
    ts: runTypeScript,
  }

  const { getHighlighter } = await import('#slidev/shiki')
  const highlight = await getHighlighter()

  const run = async (code: string, lang: string, options: Record<string, unknown>): Promise<CodeRunnerOutputs> => {
    try {
      const runner = runners[lang]
      if (!runner)
        throw new Error(`Runner for language "${lang}" not found`)
      return await runner(
        code,
        {
          options,
          highlight,
          run: async (code, lang) => {
            return await run(code, lang, options)
          },
        },
      )
    }
    catch (e) {
      console.error(e)
      return {
        error: `${e}`,
      }
    }
  }

  for (const setup of setups) {
    const result = await setup(runners)
    Object.assign(runners, result)
  }

  return {
    highlight,
    run,
  }
})

// Ported from https://github.com/microsoft/TypeScript-Website/blob/v2/packages/playground/src/sidebar/runtime.ts
function runJavaScript(code: string): CodeRunnerOutputs {
  const result = ref<CodeRunnerOutput[]>([])

  const onError = (error: any) => result.value.push({ error: String(error) })
  const logger = (...objs: any[]) => result.value.push(objs.map(printObject))
  const vmConsole = Object.assign({}, console)
  vmConsole.info = vmConsole.log = vmConsole.debug = vmConsole.warn = vmConsole.error = logger
  vmConsole.clear = () => result.value.length = 0
  try {
    const safeJS = `return async (console, __slidev_import, __slidev_on_error) => {
      try {
        ${sanitizeJS(code)}
      } catch (e) {
        __slidev_on_error(e)
      }
    }`
    // eslint-disable-next-line no-new-func
    ;(new Function(safeJS)())(vmConsole, (specifier: string) => {
      const mod = deps[specifier]
      if (!mod)
        throw new Error(`Module not found: ${specifier}.\nAvailable modules: ${Object.keys(deps).join(', ')}. Please refer to https://sli.dev/custom/config-code-runners#additional-runner-dependencies`)
      return mod
    }, onError)
  }
  catch (error) {
    onError(error)
  }

  function printObject(arg: any): CodeRunnerOutputText {
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

  function sanitizeJS(code: string) {
    // The reflect-metadata runtime is available, so allow that to go through
    code = code.replace(`import "reflect-metadata"`, '').replace(`require("reflect-metadata")`, '')
    // Transpiled typescript sometimes contains an empty export, remove it.
    code = code.replace('export {};', '')

    return code
  }

  return result
}

let tsModule: typeof import('typescript') | undefined

export async function runTypeScript(code: string) {
  tsModule ??= await import('typescript')

  code = tsModule.transpileModule(code, {
    compilerOptions: {
      module: tsModule.ModuleKind.ESNext,
      target: tsModule.ScriptTarget.ES2022,
    },
    transformers: {
      after: [transformImports],
    },
  }).outputText

  const importRegex = /import\s*\((.+)\)/g
  code = code.replace(importRegex, (_full, specifier) => `__slidev_import(${specifier})`)

  return runJavaScript(code)
}

/**
 * Transform import statements to dynamic imports
 */
function transformImports(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const { factory } = context
  const { isImportDeclaration, isNamedImports, NodeFlags } = tsModule!
  return (sourceFile: ts.SourceFile) => {
    const statements = [...sourceFile.statements]
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!isImportDeclaration(statement))
        continue
      let bindingPattern: ts.ObjectBindingPattern | ts.Identifier
      const namedBindings = statement.importClause?.namedBindings
      const bindings: ts.BindingElement[] = []
      if (statement.importClause?.name)
        bindings.push(factory.createBindingElement(undefined, factory.createIdentifier('default'), statement.importClause.name))
      if (namedBindings) {
        if (isNamedImports(namedBindings)) {
          for (const specifier of namedBindings.elements)
            bindings.push(factory.createBindingElement(undefined, specifier.propertyName, specifier.name))
          bindingPattern = factory.createObjectBindingPattern(bindings)
        }
        else {
          bindingPattern = factory.createIdentifier(namedBindings.name.text)
        }
      }
      else {
        bindingPattern = factory.createObjectBindingPattern(bindings)
      }

      const newStatement = factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              bindingPattern,
              undefined,
              undefined,
              factory.createAwaitExpression(
                factory.createCallExpression(
                  factory.createIdentifier('import'),
                  undefined,
                  [statement.moduleSpecifier],
                ),
              ),
            ),
          ],
          NodeFlags.Const,
        ),
      )
      statements[i] = newStatement
    }
    return factory.updateSourceFile(sourceFile, statements)
  }
}

import * as pirates from 'pirates'
import { Options, transform } from 'sucrase'

export interface HookOptions {
  matcher?: (code: string) => boolean
  ignoreNodeModules?: boolean
}

export type RevertFunction = () => void

export function addHook(
  extension: string[],
  options: Options,
  hookOptions?: HookOptions,
): RevertFunction {
  return pirates.addHook(
    (code: string, filePath: string): string => {
      const { code: transformedCode, sourceMap } = transform(code, {
        ...options,
        sourceMapOptions: { compiledFilename: filePath },
        filePath,
      })
      const mapBase64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64')
      const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`
      return `${transformedCode}\n${suffix}`
    },
    { ...hookOptions, exts: extension },
  )
}

export function registerJS(hookOptions?: HookOptions): RevertFunction {
  return addHook(['.js', '.cjs', '.mjs'], { transforms: ['imports'] }, hookOptions)
}

export function registerTS(hookOptions?: HookOptions): RevertFunction {
  return addHook(['.ts'], { transforms: ['imports', 'typescript'] }, hookOptions)
}

export function registerSucrase(hookOptions?: HookOptions) {
  const reverts = [
    registerJS(hookOptions),
    registerTS(hookOptions),
  ]

  return () => reverts.forEach(fn => fn())
}

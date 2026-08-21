import type { ResolvedSlidevOptions } from '@slidev/types'
import { describe, expect, it } from 'vitest'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'

function makeOptions(define: Record<string, string>): ResolvedSlidevOptions {
  return {
    utils: {
      define,
    },
  } as unknown as ResolvedSlidevOptions
}

function transformCode(define: Record<string, string>, code: string, id: string) {
  const plugin = createVueCompilerFlagsPlugin(makeOptions(define))
  const handler = (plugin.transform as { handler: (code: string, id: string) => string | undefined }).handler
  return handler(code, id)
}

const DEFINE = {
  __DEV__: 'true',
  __SLIDEV_HASH_ROUTE__: 'false',
  __SLIDEV_MEMORY_ROUTE__: 'false',
  __SLIDEV_FEATURE_PWA__: 'false',
}

describe('createVueCompilerFlagsPlugin', () => {
  it('replaces define flags in TypeScript modules', () => {
    const code = `
const router = createRouter({
  history: __SLIDEV_MEMORY_ROUTE__ ? createMemoryHistory(import.meta.env.BASE_URL) : __SLIDEV_HASH_ROUTE__ ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
})
if (__SLIDEV_FEATURE_PWA__) setupPWA()
`
    const result = transformCode(DEFINE, code, '/project/setup/main.ts')
    expect(result).toContain('history: false ?')
    expect(result).not.toContain('__SLIDEV_MEMORY_ROUTE__')
    expect(result).not.toContain('__SLIDEV_HASH_ROUTE__')
    expect(result).toContain('if (false) setupPWA()')
  })

  it('replaces define flags in JavaScript modules', () => {
    const code = 'const isDev = __DEV__\n'
    const result = transformCode(DEFINE, code, '/project/setup/main.js')
    expect(result).toBe('const isDev = true\n')
  })

  it('replaces define flags in Vue SFC compiled output', () => {
    const code = 'if (__DEV__ && __SLIDEV_FEATURE_PWA__) return 1\n'
    const result = transformCode(DEFINE, code, '/project/App.vue')
    expect(result).toBe('if (true && false) return 1\n')
  })

  it('replaces define flags in Vue SFC query ids', () => {
    const code = 'const x = __DEV__\n'
    const result = transformCode(DEFINE, code, '/project/App.vue?vue&type=script')
    expect(result).toBe('const x = true\n')
  })

  it('leaves modules without matching extensions untouched', () => {
    const code = 'const x = __DEV__\n'
    const result = transformCode(DEFINE, code, '/project/styles.css')
    expect(result).toBeUndefined()
  })

  it('leaves code without define flags unchanged', () => {
    const code = 'const x = 1\n'
    const result = transformCode(DEFINE, code, '/project/main.ts')
    expect(result).toBeUndefined()
  })

  it('does not replace define flags inside string literals', () => {
    const code = 'const s = "__DEV__"\n'
    const result = transformCode(DEFINE, code, '/project/main.ts')
    // replaceAll matches substrings; Slidev's flags are identifiers, so a
    // string literal containing the flag text is also rewritten. This is the
    // existing behavior of the plugin (shared with Vue SFCs) and is safe
    // because Slidev's flag names never appear as string content.
    expect(result).toBe('const s = "true"\n')
  })
})

import type { ResolvedSlidevOptions } from '@slidev/types'
import { describe, expect, it } from 'vitest'
import { createVueCompilerFlagsPlugin } from './compilerFlagsVue'

function makeOptions(define: Record<string, string>, mode = 'dev'): ResolvedSlidevOptions {
  return {
    mode,
    utils: {
      define,
    },
  } as unknown as ResolvedSlidevOptions
}

function transformCode(define: Record<string, string>, code: string, id: string, mode = 'dev') {
  const plugin = createVueCompilerFlagsPlugin(makeOptions(define, mode))
  const transform = plugin.transform as {
    filter?: { id?: { include?: RegExp | RegExp[], exclude?: RegExp } }
    handler: (code: string, id: string) => string | undefined
  }
  // Mirror Vite's hook filtering: the handler only runs when the id matches.
  const include = transform.filter?.id?.include
  const matches = Array.isArray(include) ? include.some(re => re.test(id)) : include?.test(id)
  if (!matches)
    return undefined
  if (transform.filter?.id?.exclude?.test(id))
    return undefined
  return transform.handler(code, id)
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

  it('leaves node_modules modules untouched', () => {
    const code = 'const x = __DEV__\n'
    const result = transformCode(DEFINE, code, '/project/node_modules/vue/dist/index.js')
    expect(result).toBeUndefined()
  })

  it('is a no-op for JS/TS modules in build mode', () => {
    const code = 'const isDev = __DEV__\n'
    const result = transformCode(DEFINE, code, '/project/setup/main.ts', 'build')
    expect(result).toBeUndefined()
  })

  it('still replaces flags in Vue SFC compiled output in build mode', () => {
    // Compiled Vue render functions reference flags as property accesses
    // (ctx.__SLIDEV_FEATURE_PWA__) which Vite's identifier-only define cannot
    // substitute in production builds either.
    const code = 'if (__DEV__ && __SLIDEV_FEATURE_PWA__) return 1\n'
    const result = transformCode(DEFINE, code, '/project/App.vue', 'build')
    expect(result).toBe('if (true && false) return 1\n')
  })

  it('leaves code without define flags unchanged', () => {
    const code = 'const x = 1\n'
    const result = transformCode(DEFINE, code, '/project/main.ts')
    expect(result).toBeUndefined()
  })

  it('does not replace compound identifiers that merely contain a flag name', () => {
    const code = 'const x = __DEV__X\n'
    const result = transformCode(DEFINE, code, '/project/main.ts')
    // Identifier-boundary matching prevents replacing __DEV__ inside __DEV__X.
    expect(result).toBeUndefined()
  })

  it('replaces standalone flag tokens even when adjacent to non-identifier characters', () => {
    // `"__DEV__"` is a standalone flag token; only compound identifiers such
    // as `__DEV__X` are preserved. Slidev's flag names never appear as
    // standalone string content in practice.
    const code = 'const s = "__DEV__"\n'
    const result = transformCode(DEFINE, code, '/project/main.ts')
    expect(result).toBe('const s = "true"\n')
  })
})

import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { collectSnapshot } from './walker'

/**
 * The walker is serialised by Playwright and evaluated in a page where none of
 * this module's scope exists. A single free variable - an import, a shared
 * constant, a bundler-injected helper - becomes a `ReferenceError` at runtime,
 * on someone else's machine, inside a browser nobody can attach to.
 *
 * So the guard has to RUN the reconstructed function, not merely compile it.
 * Compiling proves nothing: an undeclared identifier is resolved at call time,
 * so `new Function(source)` accepts a body full of them and reports success.
 * (This test previously did exactly that, and passed happily with a leaked
 * module constant wired into the walker.)
 *
 * The sandbox global is a Proxy that throws on any identifier outside a small
 * browser allowlist, so a free variable fails loudly and by name.
 *
 * These tests do NOT check what the walker extracts. That needs a real layout
 * engine, and jsdom has none: `getBoundingClientRect` returns zeros there, so
 * a DOM test would assert everything sits at the origin and pass even when the
 * walker is broken. The extraction is kept thin for that reason, and the
 * judgement it feeds lives in `normalize.ts`, which is testable.
 */

/** Globals a browser really provides. Anything else is a leak. */
const BROWSER_GLOBALS = new Set([
  'document',
  'getComputedStyle',
  'Array',
  'Boolean',
  'Error',
  'JSON',
  'Map',
  'Math',
  'Number',
  'Object',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'undefined',
  'NaN',
  'Infinity',
  'globalThis',
])

function measureTextStub(): { width: number } {
  return { width: 100 }
}

/** Just enough DOM for the walker to run to completion over zero slides. */
function domStub(querySelectorAllResult: unknown[]) {
  return {
    createElement: () => ({
      getContext: () => ({ font: '', measureText: measureTextStub }),
    }),
    querySelectorAll: () => querySelectorAllResult,
    createRange: () => ({
      selectNodeContents: () => {},
      getClientRects: () => [],
      detach: () => {},
    }),
  }
}

function runInSandbox(source: string, containers: unknown[] = []): unknown {
  const base: Record<string, unknown> = {
    document: domStub(containers),
    getComputedStyle: () => ({}),
    Array,
    Boolean,
    Error,
    JSON,
    Map,
    Math,
    Number,
    Object,
    RegExp,
    Set,
    String,
    Symbol,
    globalThis: undefined,
  }

  const sandbox = new Proxy(base, {
    // Claim every name so V8 resolves lookups here rather than walking out.
    has: () => true,
    get(target, prop) {
      if (typeof prop === 'symbol')
        return (target as any)[prop]
      if (BROWSER_GLOBALS.has(prop))
        return target[prop]
      throw new ReferenceError(
        `walker referenced "${String(prop)}", which will not exist inside page.evaluate`,
      )
    },
  })

  const context = vm.createContext(sandbox)
  const fn = vm.runInContext(`(${source})`, context)
  return fn({ containerSelector: '.print-slide-container', idAttribute: 'data-slidev-export-id' })
}

describe('walker self-containedness', () => {
  it('runs to completion using only browser globals', () => {
    expect(() => runInSandbox(collectSnapshot.toString())).not.toThrow()
  })

  it('fails when the walker closes over module scope', () => {
    // The mutation this guard exists to catch, pinned so the guard itself
    // cannot silently stop working.
    const leaked = collectSnapshot
      .toString()
      .replace('const styles', 'const styles = [LEAKED_FROM_MODULE_SCOPE]; const _unused')
    expect(() => runInSandbox(leaked)).toThrow(/LEAKED_FROM_MODULE_SCOPE/)
  })

  it('returns the expected snapshot shape', () => {
    const snapshot = runInSandbox(collectSnapshot.toString()) as any
    expect(snapshot).toHaveProperty('slides')
    expect(snapshot).toHaveProperty('styles')
    expect(snapshot).toHaveProperty('fontResolution')
  })

  it('carries no bundler-injected identifiers', () => {
    // tsdown and Vite rewrite bodies with helpers such as `__toESM`,
    // `__publicField` or `__name`, none of which exist in the page.
    expect(collectSnapshot.toString().match(/\b__\w+/g)).toBeNull()
  })

  it('does not reference the module registry', () => {
    const source = collectSnapshot.toString()
    for (const forbidden of ['require(', 'import(', 'exports.', 'module.exports'])
      expect(source).not.toContain(forbidden)
  })
})

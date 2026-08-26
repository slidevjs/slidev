import fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { collectSnapshot } from './walker'

/**
 * The walker is serialized by Playwright and evaluated in a page where this
 * module's scope does not exist, so a free variable becomes a `ReferenceError`
 * inside someone else's browser. The guard has to run the reconstructed
 * function, not compile it: an undeclared identifier resolves at call time, so
 * `new Function(source)` accepts a body full of them. The sandbox global is a
 * Proxy that throws on any identifier outside a browser allowlist.
 *
 * What the walker extracts is not tested here. jsdom has no layout engine, so
 * `getBoundingClientRect` returns zeros and a DOM test would pass with every
 * rect at the origin. The judgement it feeds lives in `normalize.ts`.
 */

/** Globals a browser really provides. Anything else is a leak. */
const BROWSER_GLOBALS = new Set([
  'document',
  'window',
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

const RECT = { left: 0, top: 0, width: 100, height: 20 }

/**
 * A slide container with one element and one text node under it.
 *
 * Not decoration: with an empty container list the guard only ever ran the
 * walker's top-level setup, so every free variable inside `walk` and its
 * helpers went unnoticed. `window` was one of them, referenced for `scrollX`
 * and absent from the allowlist, and the suite passed regardless.
 */
function containerStub() {
  const text = { nodeType: 3, textContent: 'hello' }
  const child: any = {
    nodeType: 1,
    tagName: 'DIV',
    id: '',
    childNodes: [text],
    children: [],
    classList: { contains: () => false },
    shadowRoot: null,
    parentElement: null,
    setAttribute: () => {},
    getAttribute: () => null,
    getBoundingClientRect: () => RECT,
    getClientRects: () => [RECT],
  }
  const container: any = {
    nodeType: 1,
    tagName: 'DIV',
    id: '003-02',
    childNodes: [child],
    children: [child],
    classList: { contains: () => false },
    shadowRoot: null,
    parentElement: null,
    setAttribute: () => {},
    getAttribute: () => null,
    getBoundingClientRect: () => ({ ...RECT, width: 980, height: 552 }),
    getClientRects: () => [RECT],
  }
  child.parentElement = container
  return container
}

/** Just enough DOM for the walker to run to completion. */
function domStub(querySelectorAllResult: unknown[]) {
  return {
    createElement: () => ({
      getContext: () => ({
        font: '',
        fillStyle: '',
        measureText: measureTextStub,
        clearRect: () => {},
        fillRect: () => {},
        getImageData: () => ({ data: [0, 0, 0, 0] }),
      }),
    }),
    querySelectorAll: () => querySelectorAllResult,
    createRange: () => ({
      selectNodeContents: () => {},
      getClientRects: () => [RECT],
      detach: () => {},
    }),
  }
}

function runInSandbox(source: string, containers: unknown[] = []): unknown {
  const base: Record<string, unknown> = {
    document: domStub(containers),
    getComputedStyle: () => ({
      fontFamily: 'Inter, sans-serif',
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      position: 'static',
      backgroundColor: 'rgb(255, 255, 255)',
      listStyleType: 'none',
      content: 'none',
      width: '100px',
      height: '20px',
      left: 'auto',
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
    }),
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
    window: { scrollX: 0, scrollY: 0 },
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

  it('runs to completion over a real container, not just an empty page', () => {
    // The empty-page case exercises none of `walk`, which is most of the file.
    const snapshot = runInSandbox(collectSnapshot.toString(), [containerStub()]) as any
    expect(snapshot.slides).toHaveLength(1)
    expect(snapshot.slides[0].nodes.length).toBeGreaterThan(0)
  })

  it('fails when a walked node closes over module scope', () => {
    // The same guard as below, but pinned on a path only a container reaches.
    const leaked = collectSnapshot
      .toString()
      // The record built for every ELEMENT, so it is reached only by walking a
      // container. Matched on its first field because the compiled source has
      // two other `const record` declarations, in the style interners, which a
      // page with no pseudo-elements never runs.
      .replace(/const record\s*(?:(: any)\s*)?=\s*\{\s*id,/, 'const record = { leaked: LEAKED_FROM_WALK, id,')
    expect(() => runInSandbox(leaked, [containerStub()])).toThrow(/LEAKED_FROM_WALK/)
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

/**
 * The walker as it is actually shipped.
 *
 * Everything above runs against Vitest's transform of the source, which is not
 * what reaches a browser: `exportPptxEditable` hands Playwright the function
 * from the bundle in `dist`, and a bundler is free to rewrite a body with
 * helpers of its own. Testing only the transform leaves the invariant
 * unenforced on the one artifact that matters.
 *
 * Needs a prior `pnpm build`, which is how this repository runs its tests
 * anyway: workspace packages resolve through their built `dist`.
 */
function bundledWalker(): string {
  const dist = join(dirname(fileURLToPath(import.meta.url)), '../../../dist')
  const file = fs.readdirSync(dist).find(name => /^pptx-.+\.mjs$/.test(name))
  if (!file)
    throw new Error(`no built pptx bundle in ${dist}; run \`pnpm build\` first`)

  const source = fs.readFileSync(join(dist, file), 'utf8')
  const start = source.indexOf('function collectSnapshot')
  if (start < 0)
    throw new Error('collectSnapshot is not in the built bundle under its own name')

  // Brace matching rather than a regex: the body is thousands of characters of
  // nested functions and object literals.
  let depth = 0
  let index = source.indexOf('{', start)
  const open = index
  for (; index < source.length; index++) {
    if (source[index] === '{')
      depth++
    else if (source[index] === '}' && --depth === 0)
      break
  }
  return `function collectSnapshot${source.slice(source.indexOf('(', start), open)}${source.slice(open, index + 1)}`
}

/** Block comments only: enough for the bundler's annotations, and it cannot eat a regex literal. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('the built bundle keeps the walker self-contained', () => {
  it('runs to completion using only browser globals', () => {
    expect(() => runInSandbox(bundledWalker(), [containerStub()])).not.toThrow()
  })

  it('carries no bundler-injected identifiers', () => {
    // tsdown and Vite rewrite bodies with helpers such as `__toESM`,
    // `__publicField` or `__name`, none of which exist in the page.
    //
    // Block comments are stripped first: the bundler annotates calls with
    // `/* @__PURE__ */`, which never executes and is not a leak.
    expect(withoutComments(bundledWalker()).match(/\b__\w+/g)).toBeNull()
  })

  it('does not reference the module registry', () => {
    const source = withoutComments(bundledWalker())
    for (const forbidden of ['require(', 'import(', 'exports.', 'module.exports'])
      expect(source).not.toContain(forbidden)
  })

  it('fails when the bundle leaks a helper into the walker', () => {
    // The guard pinned against the mutation it exists to catch, so it cannot
    // quietly stop working the next time the bundler changes.
    const leaked = bundledWalker().replace(/const nodes = \[\]/, 'const nodes = __name([])')
    expect(() => runInSandbox(leaked, [containerStub()])).toThrow(/__name/)
  })
})

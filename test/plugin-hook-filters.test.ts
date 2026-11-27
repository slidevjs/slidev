import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import { createContextInjectionPlugin } from '../packages/slidev/node/vite/contextInjection'
import { createSlideImportGuardPlugin, isSlideMarkdownId } from '../packages/slidev/node/vite/importGuard'
import { createSlidesLoader } from '../packages/slidev/node/vite/loaders'
import { createMonacoTypesLoader } from '../packages/slidev/node/vite/monacoTypes'
import { createPatchMonacoSourceMapPlugin } from '../packages/slidev/node/vite/patchMonacoSourceMap'
import { createPWAPlugin } from '../packages/slidev/node/vite/pwa'

// Inspect the declarative filter rather than only the hook handler: existing
// in-handler checks already worked, but Rolldown still called every hook.
function hookMatches(plugin: Plugin, name: 'transform' | 'resolveId' | 'load', id: string): boolean {
  const hook = plugin[name]
  expect(hook).toBeDefined()
  expect(typeof hook).not.toBe('function')
  const { filter } = hook as unknown as {
    filter: { id: RegExp | { include: RegExp, exclude?: RegExp } }
  }
  expect(filter).toBeDefined()
  const pattern = filter.id
  if (pattern instanceof RegExp)
    return pattern.test(id)
  return pattern.include.test(id) && !(pattern.exclude?.test(id) ?? false)
}

describe('vite plugin hook filters', () => {
  it('only injects context into user Vue component files', async () => {
    const plugin = createContextInjectionPlugin()
    expect(hookMatches(plugin, 'transform', '/project/App.vue')).toBe(true)
    expect(hookMatches(plugin, 'transform', '/project/App.vue?vue&type=script')).toBe(false)
    expect(hookMatches(plugin, 'transform', '/project/packages/client/App.vue')).toBe(false)
    expect(hookMatches(plugin, 'transform', '/@slidev/client/App.vue')).toBe(false)
    const hook = plugin.transform as { handler: (code: string, id: string) => Promise<unknown> }
    expect(await hook.handler('<script setup>const n = 1</script>', '/project/App.vue')).toContain('/* @slidev-injection */')
    expect(await hook.handler('<script setup>const n = 1</script>', '/project/packages/client/App.vue')).toBeUndefined()
  })

  it('filters slide resolver calls without narrowing the dynamic slide loader', () => {
    const options = {
      data: {
        slides: [],
        features: { katex: false },
      },
      userRoot: '/project',
      mode: 'dev',
      utils: {},
    } as unknown as ResolvedSlidevOptions
    const plugin = createSlidesLoader(options, {})
    expect(hookMatches(plugin, 'resolveId', '/@slidev/routes')).toBe(true)
    expect(hookMatches(plugin, 'resolveId', '/project/slides.md__slidev_1.md')).toBe(true)
    expect(hookMatches(plugin, 'resolveId', '/project/main.ts')).toBe(false)
    const resolve = plugin.resolveId as { handler: (id: string) => unknown }
    expect(resolve.handler('/project/slides.md__slidev_1.md')).toBe('/project/slides.md__slidev_1.md')
    expect(resolve.handler('/project/main.ts')).toBeNull()
  })

  it('limits both Monaco resolve and load hooks to the virtual prefix', async () => {
    const plugin = createMonacoTypesLoader({ userRoot: '/project', utils: {} } as ResolvedSlidevOptions)
    for (const name of ['resolveId', 'load'] as const) {
      expect(hookMatches(plugin, name, '/@slidev-monaco-types/resolve?pkg=vue')).toBe(true)
      expect(hookMatches(plugin, name, '/@slidev-monaco-types/load?name=vue')).toBe(true)
      expect(hookMatches(plugin, name, '/project/App.vue')).toBe(false)
    }
    const resolve = plugin.resolveId as { handler: (id: string) => unknown }
    const load = plugin.load as { handler: (id: string) => Promise<unknown> }
    expect(resolve.handler('/@slidev-monaco-types/resolve?pkg=vue')).toBe('/@slidev-monaco-types/resolve?pkg=vue')
    expect(resolve.handler('/project/App.vue')).toBeNull()
    expect(await load.handler('/project/App.vue')).toBeNull()
  })

  it('filters slide loader post-transform hook to slide source ids', () => {
    const options = {
      data: {
        slides: [],
        features: { katex: false },
      },
      userRoot: '/project',
      mode: 'dev',
      utils: {},
    } as unknown as ResolvedSlidevOptions
    const plugin = createSlidesLoader(options, {})
    expect(hookMatches(plugin, 'transform', '/project/slides.md__slidev_1.md')).toBe(true)
    expect(hookMatches(plugin, 'transform', '/project/slides.md__slidev_1.frontmatter')).toBe(true)
    expect(hookMatches(plugin, 'transform', '/project/slides.md__slidev_1.md?vue&type=script')).toBe(false)
    expect(hookMatches(plugin, 'transform', '/@slidev/routes')).toBe(false)
    expect(hookMatches(plugin, 'transform', '/project/main.ts')).toBe(false)
  })

  it('filters monaco sourcemap patch load hook to monaco base files', () => {
    const plugin = createPatchMonacoSourceMapPlugin()
    expect(hookMatches(plugin, 'load', '/project/node_modules/monaco-editor/esm/vs/base/common/uri.js')).toBe(true)
    expect(hookMatches(plugin, 'load', '/project/node_modules/monaco-editor/esm/vs/base/common/uri.js?v=1')).toBe(true)
    expect(hookMatches(plugin, 'load', '/project/node_modules/monaco-editor/esm/vs/editor/editor.api.js')).toBe(false)
    expect(hookMatches(plugin, 'load', '/project/App.vue')).toBe(false)
    const load = plugin.load as { handler: (id: string) => unknown }
    expect(load.handler('/project/App.vue')).toBeUndefined()
  })

  it('filters slide import guard transform hook identically to isSlideMarkdownId', async () => {
    const plugin = createSlideImportGuardPlugin()
    const cases: Array<[string, boolean]> = [
      ['/project/slides.md__slidev_1.md', true],
      ['/project/slides.md__slidev_1.md?vue&type=script', true],
      ['/project/slides.md__slidev_2.frontmatter', true],
      ['/project/slides.md__slidev_2.frontmatter#hash', true],
      ['/@slidev/title-renderer.md', true],
      ['/@slidev/title-renderer.md?import', true],
      ['/@slidev/titles.md', true],
      ['/@slidev/titles.md#section', true],
      ['/@slidev/title-renderer', false],
      ['/prefix/@slidev/title-renderer.md', false],
      ['/project/foo.ts?x=__slidev_1.md', false],
      ['/project/slides.md__slidev_1.md.bak', false],
      ['/project/App.vue', false],
    ]
    for (const [id, expected] of cases) {
      expect(isSlideMarkdownId(id), id).toBe(expected)
      expect(hookMatches(plugin, 'transform', id), id).toBe(expected)
    }
    const transform = plugin.transform as { handler: (code: string, id: string) => Promise<unknown> }
    expect(await transform.handler('export default {}', '/project/App.vue')).toBeNull()
  })

  it('filters PWA register stub resolveId and load hooks to its virtual module', async () => {
    const plugin = await createPWAPlugin({
      mode: 'dev',
      data: {
        config: {
          pwa: false,
        },
      },
    } as ResolvedSlidevOptions) as Plugin
    expect(hookMatches(plugin, 'resolveId', 'virtual:pwa-register')).toBe(true)
    expect(hookMatches(plugin, 'resolveId', '\0virtual:pwa-register')).toBe(false)
    expect(hookMatches(plugin, 'resolveId', '/project/main.ts')).toBe(false)
    expect(hookMatches(plugin, 'load', '\0virtual:pwa-register')).toBe(true)
    expect(hookMatches(plugin, 'load', 'virtual:pwa-register')).toBe(false)
    expect(hookMatches(plugin, 'load', '/project/main.ts')).toBe(false)
    const resolve = plugin.resolveId as { handler: (id: string) => unknown }
    const load = plugin.load as { handler: (id: string) => unknown }
    expect(resolve.handler('virtual:pwa-register')).toBe('\0virtual:pwa-register')
    expect(resolve.handler('/project/main.ts')).toBeUndefined()
    expect(load.handler('\0virtual:pwa-register')).toContain('registerSW')
    expect(load.handler('/project/main.ts')).toBeUndefined()
  })
})

import type { ResolvedSlidevOptions } from '@slidev/types'
import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import { createContextInjectionPlugin } from '../packages/slidev/node/vite/contextInjection'
import { createSlidesLoader } from '../packages/slidev/node/vite/loaders'
import { createMonacoTypesLoader } from '../packages/slidev/node/vite/monacoTypes'

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
      data: { slides: [], features: { katex: false } },
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
})

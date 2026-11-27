import type { ResolvedSlidevOptions } from '@slidev/types'
import { expect, it, vi } from 'vitest'
import { buildPresentation } from './build'

const mocks = vi.hoisted(() => ({
  build: vi.fn(),
  resolveViteConfigs: vi.fn(),
}))

vi.mock('vite', () => ({ build: mocks.build }))
vi.mock('./shared', () => ({ resolveViteConfigs: mocks.resolveViteConfigs }))

it('builds the presentation without hosting post-processing', async () => {
  const options = {
    userRoot: '/project',
    utils: { indexHtml: '<html>presentation</html>' },
  } as ResolvedSlidevOptions
  const config = {
    build: { outDir: 'output' },
    base: './',
  }
  const override = {
    base: './',
    build: { outDir: 'output' },
  }
  mocks.resolveViteConfigs.mockImplementation(async (_options, base) => {
    const plugin = base.plugins[0]
    plugin.configResolved(config)
    expect(plugin.load.handler('/project/index.html')).toBe(options.utils.indexHtml)
    return config
  })

  expect(await buildPresentation(options, override)).toBe(config)
  expect(mocks.resolveViteConfigs).toHaveBeenCalledWith(options, expect.any(Object), override, 'build')
  expect(mocks.build).toHaveBeenCalledWith(config)
})

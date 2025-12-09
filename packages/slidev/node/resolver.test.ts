import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createResolver, getRoots } from './resolver'

const mocks = vi.hoisted(() => {
  const FAKE_ROOT = '/user/project'
  return {
    findDepPkgJsonPath: vi.fn((name: string) => {
      if (name === '@slidev/client')
        return `${FAKE_ROOT}/node_modules/@slidev/client/package.json`
      if (name === '@slidev/theme-official')
        return `${FAKE_ROOT}/node_modules/@slidev/theme-official/package.json`
      if (name === 'slidev-theme-xyz')
        return `${FAKE_ROOT}/node_modules/slidev-theme-xyz/package.json`
      if (name === 'slidev-theme-full')
        return `${FAKE_ROOT}/node_modules/slidev-theme-full/package.json`
      return null
    }),
    findClosestPkgJsonPath: vi.fn().mockResolvedValue(`${FAKE_ROOT}/package.json`),
  }
})

vi.mock('vitefu', () => ({
  findDepPkgJsonPath: mocks.findDepPkgJsonPath,
  findClosestPkgJsonPath: mocks.findClosestPkgJsonPath,
}))

describe('createResolver', () => {
  beforeEach(async () => {
    await getRoots('/user/project')
  })

  it('resolves @slidev/ official prefixed theme', async () => {
    const resolver = createResolver('theme', {})

    const res = await resolver('official', '/')

    expect(res).toEqual([
      '@slidev/theme-official',
      '/user/project/node_modules/@slidev/theme-official',
    ],
    )
  })

  it('resolves slidev-theme- third party prefixed theme', async () => {
    const resolver = createResolver('theme', {})

    const res = await resolver('xyz', '/')

    expect(res).toEqual([
      'slidev-theme-xyz',
      '/user/project/node_modules/slidev-theme-xyz',
    ],
    )
  })

  it('resolves fully-specified package', async () => {
    const resolver = createResolver('theme', {})

    const res = await resolver('slidev-theme-full', '/')

    expect(res).toEqual([
      'slidev-theme-full',
      '/user/project/node_modules/slidev-theme-full',
    ],
    )
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createResolver, getRoots } from './resolver'

const vitefuMocks = vi.hoisted(() => {
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

vi.mock('vitefu', () => vitefuMocks)

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

  it('resolves valid scoped name through validation', async () => {
    const resolver = createResolver('theme', {})

    const res = await resolver('@slidev/theme-official', '/')

    expect(res).toEqual([
      '@slidev/theme-official',
      '/user/project/node_modules/@slidev/theme-official',
    ])
  })

  it('passes through "none" without validation', async () => {
    const resolver = createResolver('theme', {})

    const res = await resolver('none', '/')

    expect(res).toEqual(['', null])
  })

  it('rejects names with shell metacharacters', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('evil$(rm -rf)', '/')).rejects.toThrowError(
      'Invalid theme name "evil$(rm -rf)". Only valid npm package names are allowed.',
    )
  })

  it('rejects names with backslashes', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('evil\\package', '/')).rejects.toThrowError(
      /Invalid theme name/,
    )
  })

  it('rejects names with uppercase letters', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('EvilTheme', '/')).rejects.toThrowError(
      /Invalid theme name/,
    )
  })

  it('rejects scoped names with extra slash segments', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('@scope/foo/bar', '/')).rejects.toThrowError(
      /Invalid theme name/,
    )
  })

  it('rejects scoped names with parent traversal segment', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('@evil/../escape', '/')).rejects.toThrowError(
      /Invalid theme name/,
    )
  })

  it('rejects empty string', async () => {
    const resolver = createResolver('theme', {})

    await expect(resolver('', '/')).rejects.toThrowError(
      /Invalid theme name/,
    )
  })

  it('reflects the resolver type in the error message', async () => {
    const resolver = createResolver('addon', {})

    await expect(resolver('evil$(rm -rf)', '/')).rejects.toThrowError(
      'Invalid addon name "evil$(rm -rf)". Only valid npm package names are allowed.',
    )
  })
})

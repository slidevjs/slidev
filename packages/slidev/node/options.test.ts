import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveOptions } from './options'

const mocks = vi.hoisted(() => ({
  getRoots: vi.fn(),
  getThemeMeta: vi.fn(),
  load: vi.fn(),
  resolveAddons: vi.fn(),
  resolveConfig: vi.fn(),
  resolveEntry: vi.fn(),
  resolveTheme: vi.fn(),
}))

vi.mock('./integrations/addons', () => ({
  resolveAddons: mocks.resolveAddons,
}))

vi.mock('./integrations/themes', () => ({
  getThemeMeta: mocks.getThemeMeta,
  resolveTheme: mocks.resolveTheme,
}))

vi.mock('./parser', () => ({
  parser: {
    load: mocks.load,
    resolveConfig: mocks.resolveConfig,
  },
}))

vi.mock('./resolver', () => ({
  getRoots: mocks.getRoots,
  resolveEntry: mocks.resolveEntry,
  toAtFS: (value: string) => value,
}))

vi.mock('./setups/indexHtml', () => ({ default: vi.fn().mockResolvedValue('') }))
vi.mock('./setups/katex', () => ({ default: vi.fn().mockResolvedValue({}) }))
vi.mock('./setups/shiki', () => ({ default: vi.fn().mockResolvedValue({}) }))

describe('resolveOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveEntry.mockResolvedValue('/project/slides.md')
    mocks.getRoots.mockResolvedValue({
      clientRoot: '/client',
      userPkgJson: {},
      userRoot: '/project',
      userWorkspaceRoot: '/workspace',
    })
    mocks.resolveTheme.mockResolvedValue(['slidev-theme-test', '/theme'])
    mocks.getThemeMeta.mockResolvedValue({})
    mocks.resolveAddons.mockResolvedValue(['/addon'])
    mocks.resolveConfig.mockReturnValue({
      addons: ['slidev-addon-test'],
      browserExporter: false,
      drawings: { enabled: false, persist: false },
      monacoTypesIgnorePackages: [],
      presenter: false,
      pwa: false,
      record: false,
      routerMode: 'history',
    })
  })

  it('reloads with bootstrap roots while resolving final non-discovery config', async () => {
    const initialData = {
      headmatter: {
        addons: ['slidev-addon-bootstrap'],
        routerMode: 'hash',
        theme: 'bootstrap',
        title: 'before',
      },
      slides: [{ content: 'before addon preparser' }],
    }
    const reloadedData = {
      headmatter: {
        addons: ['slidev-addon-final'],
        routerMode: 'memory',
        theme: 'final',
        title: 'after',
      },
      slides: [{ content: 'after addon preparser' }],
    }
    const initialConfig = {
      addons: ['slidev-addon-bootstrap'],
      routerMode: 'hash',
      theme: 'bootstrap',
    }
    const finalConfig = {
      addons: ['slidev-addon-final'],
      browserExporter: false,
      download: false,
      drawings: { enabled: false, persist: false },
      monacoTypesIgnorePackages: [],
      presenter: false,
      pwa: false,
      record: false,
      routerMode: 'memory',
      theme: 'final',
      title: 'after',
    }
    mocks.load
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(reloadedData)
    mocks.resolveConfig
      .mockReturnValueOnce(initialConfig)
      .mockReturnValueOnce(finalConfig)

    const options = await resolveOptions({
      download: true,
      entry: '/project/slides.md',
    }, 'dev')

    expect(mocks.load).toHaveBeenNthCalledWith(1, {
      allowedRoots: ['/workspace', '/project'],
      roots: ['/project'],
      userRoot: '/project',
    }, '/project/slides.md', undefined, 'dev')
    expect(mocks.resolveTheme).toHaveBeenCalledWith('bootstrap', '/project/slides.md')
    expect(mocks.resolveConfig).toHaveBeenNthCalledWith(
      1,
      initialData.headmatter,
      {},
      '/project/slides.md',
    )
    expect(mocks.resolveAddons).toHaveBeenCalledWith(initialConfig.addons)
    expect(mocks.load).toHaveBeenNthCalledWith(2, {
      allowedRoots: ['/workspace', '/theme', '/addon', '/project'],
      roots: ['/theme', '/addon', '/project'],
      userRoot: '/project',
    }, '/project/slides.md', undefined, 'dev')
    expect(mocks.resolveConfig).toHaveBeenNthCalledWith(
      2,
      reloadedData.headmatter,
      {},
      '/project/slides.md',
    )
    expect(mocks.load).toHaveBeenCalledTimes(2)
    expect(mocks.resolveTheme).toHaveBeenCalledTimes(1)
    expect(mocks.resolveAddons).toHaveBeenCalledTimes(1)
    expect(mocks.resolveConfig).toHaveBeenCalledTimes(2)
    expect(options.roots).toEqual(['/theme', '/addon', '/project'])
    expect(options.data.config).toBe(finalConfig)
    expect(options.data.config).toMatchObject({
      addons: ['slidev-addon-bootstrap'],
      download: true,
      routerMode: 'memory',
      theme: 'bootstrap',
      title: 'after',
    })
    expect(options.data.config.theme).toBe(options.themeRaw)
    expect(options.data.headmatter).toEqual(reloadedData.headmatter)
    expect(options.data.slides).toEqual(reloadedData.slides)
  })
})

import { resolve, sep } from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeInvocationSearchPaths,
  createResolver,
  findInvocationNodeModulesPath,
  getRoots,
} from './resolver'

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

// Virtual filesystem the `node:fs` mock reads from. Tests populate it with
// the paths they care about before exercising the resolver helpers.
type FsNodeKind = 'dir' | 'file' | 'symlink'
interface FsNode { kind: FsNodeKind, target?: string }
const fsMocks = vi.hoisted(() => {
  const tree = new Map<string, { kind: 'dir' | 'file' | 'symlink', target?: string }>()
  const ENOENT = (path: string) => {
    const err = Object.assign(new Error(`ENOENT: no such file or directory '${path}'`), { code: 'ENOENT' })
    return err
  }
  return {
    tree,
    existsSync: vi.fn((path: string) => tree.has(path)),
    lstatSync: vi.fn((path: string) => {
      const node = tree.get(path)
      if (!node)
        throw ENOENT(path)
      return {
        isSymbolicLink: () => node.kind === 'symlink',
        isDirectory: () => node.kind === 'dir',
        isFile: () => node.kind === 'file',
      }
    }),
    readlinkSync: vi.fn((path: string) => {
      const node = tree.get(path)
      if (!node || node.kind !== 'symlink')
        throw Object.assign(new Error(`EINVAL: readlink '${path}'`), { code: 'EINVAL' })
      return node.target!
    }),
    readdirSync: vi.fn((path: string) => {
      const node = tree.get(path)
      if (!node || node.kind !== 'dir')
        throw Object.assign(new Error(`ENOTDIR: scandir '${path}'`), { code: 'ENOTDIR' })
      const prefix = path.endsWith(sep) ? path : `${path}${sep}`
      const children = new Set<string>()
      for (const key of tree.keys()) {
        if (key === path)
          continue
        if (key.startsWith(prefix)) {
          const rest = key.slice(prefix.length)
          const first = rest.split(sep)[0]
          if (first)
            children.add(first)
        }
      }
      return Array.from(children).sort()
    }),
  }
})

vi.mock('node:fs', () => fsMocks)

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

function setNode(path: string, node: FsNode) {
  fsMocks.tree.set(resolve(path), node)
}
function dir(path: string) {
  setNode(path, { kind: 'dir' })
}
function symlink(path: string, target: string) {
  // `readlinkSync` returns the target verbatim — relative or absolute — so we
  // store it as-given rather than resolving eagerly, so relative-target paths
  // exercise the dirname-relative branch in `findInvocationNodeModulesPath`.
  setNode(path, { kind: 'symlink', target })
}

describe('findInvocationNodeModulesPath', () => {
  beforeEach(() => {
    fsMocks.tree.clear()
  })

  it('returns undefined when argv1 is undefined', () => {
    expect(findInvocationNodeModulesPath(undefined)).toBeUndefined()
  })

  it('returns undefined when argv1 is empty', () => {
    expect(findInvocationNodeModulesPath('')).toBeUndefined()
  })

  it('extracts the trailing node_modules from a pnpm v11 shell-shim dispatched path', () => {
    // `{PNPM_HOME}/bin/slidev` shell shim exec's `node <path-to-cli>.mjs`.
    const argv1 = resolve('/pnpm-home/v11/abc123/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath(argv1)).toBe(
      resolve('/pnpm-home/v11/abc123/node_modules'),
    )
  })

  it('extracts node_modules from an npm/yarn globals path', () => {
    const argv1 = resolve('/usr/local/lib/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath(argv1)).toBe(
      resolve('/usr/local/lib/node_modules'),
    )
  })

  it('extracts node_modules from a local project install path', () => {
    const argv1 = resolve('/my/project/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath(argv1)).toBe(
      resolve('/my/project/node_modules'),
    )
  })

  it('uses the last node_modules segment when paths nest', () => {
    // Some monorepos have stacked node_modules (e.g. project-level + pnpm's
    // own `.pnpm` virtual store). The closest one to the script wins.
    const argv1 = resolve('/project/node_modules/.pnpm/@slidev+cli@x/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath(argv1)).toBe(
      resolve('/project/node_modules/.pnpm/@slidev+cli@x/node_modules'),
    )
  })

  it('follows a single fs symlink when argv1 itself has no node_modules segment', () => {
    // Legacy `.bin` symlink layout: `{prefix}/bin/slidev` -> install group's
    // `node_modules/@slidev/cli/bin/slidev.mjs`.
    symlink('/usr/local/bin/slidev', '/usr/local/lib/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath('/usr/local/bin/slidev')).toBe(
      resolve('/usr/local/lib/node_modules'),
    )
  })

  it('returns undefined when argv1 is neither a symlink nor under a node_modules', () => {
    setNode('/some/random/binary', { kind: 'file' })
    expect(findInvocationNodeModulesPath('/some/random/binary')).toBeUndefined()
  })

  it('returns undefined when argv1 does not exist and has no node_modules in its literal path', () => {
    expect(findInvocationNodeModulesPath('/does/not/exist')).toBeUndefined()
  })

  it('handles relative symlink targets', () => {
    // pnpm typically writes relative targets like `../../@slidev/cli/...`.
    symlink('/usr/local/bin/slidev', '../lib/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath('/usr/local/bin/slidev')).toBe(
      resolve('/usr/local/lib/node_modules'),
    )
  })

  it('follows multi-hop symlink chains and stops at the first node_modules', () => {
    // `bin/slidev` -> `bin/slidev.real` (still under `bin/`) -> the actual
    // `.mjs` file under a `node_modules/`.
    symlink('/prefix/bin/slidev', '/prefix/bin/slidev.real')
    symlink('/prefix/bin/slidev.real', '/prefix/lib/node_modules/@slidev/cli/bin/slidev.mjs')
    expect(findInvocationNodeModulesPath('/prefix/bin/slidev')).toBe(
      resolve('/prefix/lib/node_modules'),
    )
  })

  it('gives up after a long symlink chain that never enters a node_modules', () => {
    // Build a 20-hop chain of symlinks that all point at each other,
    // none of which contain `node_modules`.
    for (let i = 0; i < 20; i++)
      symlink(`/chain/${i}`, `/chain/${i + 1}`)
    setNode(resolve('/chain/20'), { kind: 'file' })
    expect(findInvocationNodeModulesPath('/chain/0')).toBeUndefined()
  })
})

describe('computeInvocationSearchPaths', () => {
  beforeEach(() => {
    fsMocks.tree.clear()
  })

  it('returns an empty array when input is undefined', () => {
    expect(computeInvocationSearchPaths(undefined)).toEqual([])
  })

  it('returns just the input when there are no siblings to enumerate', () => {
    // The grandparent of `ownNodeModules` doesn't contain any other install
    // groups (e.g. npm globals layout: only `/usr/local/lib/node_modules`).
    dir('/usr/local')
    dir('/usr/local/lib')
    dir('/usr/local/lib/node_modules')
    expect(computeInvocationSearchPaths(resolve('/usr/local/lib/node_modules'))).toEqual([
      resolve('/usr/local/lib/node_modules'),
    ])
  })

  it('enumerates every sibling install group in pnpm v11\'s isolated globals layout', () => {
    // pnpm v11 creates one `{hash}/` directory per top-level `pnpm add -g`
    // target. Each has its own `node_modules/`.
    dir('/pnpm-home/v11')
    dir('/pnpm-home/v11/abc')
    dir('/pnpm-home/v11/abc/node_modules')
    dir('/pnpm-home/v11/def')
    dir('/pnpm-home/v11/def/node_modules')
    dir('/pnpm-home/v11/ghi')
    dir('/pnpm-home/v11/ghi/node_modules')
    const result = computeInvocationSearchPaths(resolve('/pnpm-home/v11/abc/node_modules'))
    expect(result).toEqual(expect.arrayContaining([
      resolve('/pnpm-home/v11/abc/node_modules'),
      resolve('/pnpm-home/v11/def/node_modules'),
      resolve('/pnpm-home/v11/ghi/node_modules'),
    ]))
    expect(result[0]).toBe(resolve('/pnpm-home/v11/abc/node_modules'))
    expect(result).toHaveLength(3)
  })

  it('skips sibling install groups that have no node_modules subdirectory', () => {
    dir('/pnpm-home/v11')
    dir('/pnpm-home/v11/abc')
    dir('/pnpm-home/v11/abc/node_modules')
    dir('/pnpm-home/v11/empty') // no node_modules child
    expect(computeInvocationSearchPaths(resolve('/pnpm-home/v11/abc/node_modules'))).toEqual([
      resolve('/pnpm-home/v11/abc/node_modules'),
    ])
  })

  it('returns just the input when the global root is unreadable', () => {
    // Grandparent isn't listed in the virtual fs at all -> readdirSync throws.
    expect(computeInvocationSearchPaths(resolve('/missing-root/abc/node_modules'))).toEqual([
      resolve('/missing-root/abc/node_modules'),
    ])
  })

  it('does not include the input directory as its own sibling', () => {
    dir('/pnpm-home/v11')
    dir('/pnpm-home/v11/abc')
    dir('/pnpm-home/v11/abc/node_modules')
    const result = computeInvocationSearchPaths(resolve('/pnpm-home/v11/abc/node_modules'))
    // Exactly one occurrence of the input path.
    expect(result.filter(p => p === resolve('/pnpm-home/v11/abc/node_modules'))).toHaveLength(1)
  })
})

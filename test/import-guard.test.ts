import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractImportSources, isPublicAsset } from '../packages/slidev/node/vite/importGuard'

describe('slide-import-guard', () => {
  describe('isPublicAsset', () => {
    let publicDir: string

    beforeAll(() => {
      publicDir = mkdtempSync(join(tmpdir(), 'slidev-public-'))
      mkdirSync(join(publicDir, 'avatars'), { recursive: true })
      writeFileSync(join(publicDir, 'logo.png'), '')
      writeFileSync(join(publicDir, 'avatars', 'foo.png'), '')
    })

    afterAll(() => {
      rmSync(publicDir, { recursive: true, force: true })
    })

    it('exempts a root-absolute URL pointing at an existing public asset', () => {
      // The exact case from the bug: `<img src="/logo.png">` compiles to
      // `import _imports_0 from '/logo.png'`.
      expect(isPublicAsset('/logo.png', { publicDir })).toBe(true)
      expect(isPublicAsset('/avatars/foo.png', { publicDir })).toBe(true)
    })

    it('ignores query and hash suffixes when mapping to disk', () => {
      expect(isPublicAsset('/logo.png?url', { publicDir })).toBe(true)
      expect(isPublicAsset('/logo.png#frag', { publicDir })).toBe(true)
    })

    it('does not exempt root-absolute URLs missing from the public dir', () => {
      expect(isPublicAsset('/nope.png', { publicDir })).toBe(false)
    })

    it('does not exempt path-traversal URLs escaping the public dir', () => {
      expect(isPublicAsset('/../logo.png', { publicDir })).toBe(false)
      expect(isPublicAsset('/../../etc/passwd', { publicDir })).toBe(false)
    })

    it('does not exempt Vite internal URLs', () => {
      expect(isPublicAsset('/@fs/logo.png', { publicDir })).toBe(false)
      expect(isPublicAsset('/@id/virtual', { publicDir })).toBe(false)
    })

    it('does not exempt bare or relative imports', () => {
      expect(isPublicAsset('vue', { publicDir })).toBe(false)
      expect(isPublicAsset('./local.png', { publicDir })).toBe(false)
      expect(isPublicAsset('../local.png', { publicDir })).toBe(false)
    })

    it('is disabled when publicDir is falsy', () => {
      expect(isPublicAsset('/logo.png', { publicDir: '' })).toBe(false)
    })
  })

  describe('extractImportSources', () => {
    it('finds the static import the SFC compiler emits for a public img src', () => {
      const compiled = `import _imports_0 from '/logo.png'\nexport default {}\n`
      const sources = extractImportSources(compiled, 'slides.md__slidev_1.md')
      expect(sources.map(s => s.value)).toContain('/logo.png')
    })
  })
})

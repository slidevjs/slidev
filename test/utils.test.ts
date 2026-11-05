import type { ResolvedFontOptions, SlideInfo } from '@slidev/types'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slash } from '@antfu/utils'
import MarkdownExit from 'markdown-exit'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { getExportClickSteps, parseAspectRatio, parseRangeString, resolveExportClicks, validateExportClicks } from '../packages/parser/src'
import { getRoots, toAtFS } from '../packages/slidev/node/resolver'
import { createMakeAbsoluteImportGlob, generateCoollabsFontsUrl, generateGoogleFontsUrl, stringifyMarkdownTokens, updateFrontmatterPatch } from '../packages/slidev/node/utils'

describe('utils', () => {
  it('page-range', () => {
    expect(parseRangeString(5)).toEqual([1, 2, 3, 4, 5])
    expect(parseRangeString(5, 'all')).toEqual([1, 2, 3, 4, 5])
    expect(parseRangeString(2, '*')).toEqual([1, 2])
    expect(parseRangeString(5, '1')).toEqual([1])
    expect(parseRangeString(10, '1,2-3,5')).toEqual([1, 2, 3, 5])
    expect(parseRangeString(10, '1;2-3;5')).toEqual([1, 2, 3, 5])
    expect(parseRangeString(10, '6-')).toEqual([6, 7, 8, 9, 10])
  })

  it('export-clicks', () => {
    expect(resolveExportClicks(undefined, false)).toBe(false)
    expect(resolveExportClicks(undefined, true)).toBe(true)
    expect(resolveExportClicks(null, true)).toBe(true)
    expect(resolveExportClicks('last', true)).toBe(false)
    expect(resolveExportClicks(true, false)).toBe(true)
    expect(resolveExportClicks([5, 0, 2, 2], false)).toEqual([0, 2, 2, 5])
    expect(resolveExportClicks('0,2-3', false)).toEqual([0, [2, 3]])
    expect(resolveExportClicks('3; 1-2', false)).toEqual([[1, 2], 3])
    expect(resolveExportClicks(['0', '2-3'], false)).toEqual([0, [2, 3]])
    expect(resolveExportClicks([0, 'last'], false)).toEqual([0, Infinity])
    expect(resolveExportClicks('2-', false)).toEqual([[2, Infinity]])
    expect(resolveExportClicks('all', false)).toBe(true)
    expect(resolveExportClicks('none', true)).toEqual([])
    expect(resolveExportClicks([], true)).toEqual([])
    expect(resolveExportClicks('', true)).toEqual([])
    expect(resolveExportClicks([1.5, -1, 2], false)).toEqual([2])
    expect(resolveExportClicks('foo', true)).toBe(true)
    expect(resolveExportClicks('foo', false)).toBe(false)

    expect(validateExportClicks(undefined)).toBeUndefined()
    expect(validateExportClicks(true)).toBeUndefined()
    expect(validateExportClicks('last')).toBeUndefined()
    expect(validateExportClicks('0,2-3,last')).toBeUndefined()
    expect(validateExportClicks([])).toBeUndefined()
    expect(validateExportClicks('foo')).toMatch(/Invalid `exportClicks` value "foo"/)
    expect(validateExportClicks(false)).toMatch(/Invalid `exportClicks` value false/)
    expect(validateExportClicks([1, 'two'])).toMatch(/Invalid `exportClicks` value \[1,"two"\]/)

    expect(getExportClickSteps(false, 0, 3)).toEqual([3])
    expect(getExportClickSteps(true, 0, 3)).toEqual([0, 1, 2, 3])
    expect(getExportClickSteps(true, 2, 3)).toEqual([2, 3])
    expect(getExportClickSteps([], 0, 3)).toEqual([])
    expect(getExportClickSteps([0, 2, 5], 0, 3)).toEqual([0, 2, 3])
    expect(getExportClickSteps([0, 2, 5, 99], 1, 3)).toEqual([1, 2, 3])
    expect(getExportClickSteps([0, 2, 5], 0, 0)).toEqual([0])
    expect(getExportClickSteps([0, Infinity], 0, 3)).toEqual([0, 3])
    expect(getExportClickSteps([[2, Infinity]], 0, 4)).toEqual([2, 3, 4])
    expect(getExportClickSteps([[0, 1], [1, 2]], 0, 4)).toEqual([0, 1, 2])
  })

  it('aspect-ratio', () => {
    expect(parseAspectRatio(1)).toEqual(1)
    expect(parseAspectRatio('16/9')).toEqual(16 / 9)
    expect(parseAspectRatio('16 / 9 ')).toEqual(16 / 9)
    expect(parseAspectRatio('3:4')).toEqual(3 / 4)
    expect(parseAspectRatio('1x1')).toEqual(1)
    expect(parseAspectRatio('1')).toEqual(1)

    expect(() => parseAspectRatio('hello')).toThrow()
    expect(() => parseAspectRatio('1/0')).toThrow()
  })

  it('stringify-markdown-tokens', () => {
    const md = MarkdownExit({ html: true })
    const stringify = (src: string) => stringifyMarkdownTokens(md.parseInline(src, {}))

    expect(stringify('<span style="color:red">Composable</span> Vue')).toBe('Composable Vue')
    expect(stringify('<b>Whatever</b>')).toBe('Whatever')
    expect(stringify('Talk about `<details/>`')).toBe('Talk about <details/>')
    expect(stringify('What is Readonly\\<T\\> in TypeScript')).toBe('What is Readonly<T> in TypeScript')
    expect(stringify('Welcome to<br />*Slidev*')).toBe('Welcome to Slidev')
  })

  it('google-fonts', () => {
    expect(
      generateGoogleFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()

    expect(
      generateGoogleFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        italic: true,
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()
  })

  it('coollabs-fonts', () => {
    expect(
      generateCoollabsFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()

    expect(
      generateCoollabsFontsUrl({
        webfonts: ['Fira Code', 'PT Serif'],
        weights: ['200', '400', '600'],
        italic: true,
        provider: 'google',
      } as ResolvedFontOptions),
    ).toMatchSnapshot()
  })

  it('roots', async () => {
    const { cliRoot, clientRoot, userRoot, userWorkspaceRoot } = await getRoots(resolve('slides.md'))
    const expectRelative = (v: string) => expect(slash(relative(__dirname, v)))
    expectRelative(cliRoot).toMatchInlineSnapshot(`"../packages/slidev"`)
    expectRelative(clientRoot).toMatchInlineSnapshot(`"../packages/client"`)
    expectRelative(userRoot).toMatchInlineSnapshot(`".."`)
    expectRelative(userWorkspaceRoot).toMatchInlineSnapshot(`".."`)
  })

  it('proxies slidev import globs through a real filesystem module', () => {
    const root = mkdtempSync(join(tmpdir(), 'slidev-import-glob-'))
    const makeAbsoluteImportGlob = createMakeAbsoluteImportGlob(root)

    try {
      const proxyUrl = makeAbsoluteImportGlob([
        join(root, 'setup/main.ts'),
      ], { import: 'default' })
      const secondProxyUrl = makeAbsoluteImportGlob([
        join(root, 'theme/setup/main.ts'),
      ], { import: 'default' })

      expect(proxyUrl).toMatch(/^\/@fs\/.*\/node_modules\/\.slidev\/virtual\/import-glob\.[a-f0-9]{10}\.ts$/)
      expect(secondProxyUrl).toMatch(/^\/@fs\/.*\/node_modules\/\.slidev\/virtual\/import-glob\.[a-f0-9]{10}\.ts$/)
      expect(secondProxyUrl).not.toBe(proxyUrl)
      const content = readFileSync(fileURLToPath(`file://${proxyUrl.slice('/@fs'.length)}`), 'utf-8')
      const secondContent = readFileSync(fileURLToPath(`file://${secondProxyUrl.slice('/@fs'.length)}`), 'utf-8')
      expect(proxyUrl).toBe(toAtFS(join(root, `node_modules/.slidev/virtual/import-glob.${createHash('sha256').update(content).digest('hex').slice(0, 10)}.ts`)))
      expect(secondProxyUrl).toBe(toAtFS(join(root, `node_modules/.slidev/virtual/import-glob.${createHash('sha256').update(secondContent).digest('hex').slice(0, 10)}.ts`)))
      expect(content)
        .toBe('export default import.meta.glob(["../../../setup/main.ts"], {"eager":true,"exhaustive":true,"import":"default"})\n')
      expect(secondContent)
        .toBe('export default import.meta.glob(["../../../theme/setup/main.ts"], {"eager":true,"exhaustive":true,"import":"default"})\n')
    }
    finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('update frontmatter patch', async () => {
    const dragPos = {
      foo: '1,2,3,4',
    }
    function createFakeSource(yaml: string) {
      const doc = YAML.parseDocument(yaml)
      return {
        frontmatter: {},
        source: {
          frontmatter: doc.toJSON() || {},
          frontmatterRaw: yaml,
          frontmatterDoc: doc,
        },
      } as SlideInfo
    }
    function expectFrontmatter(slide: SlideInfo) {
      return expect(slide.source.frontmatterDoc?.toString())
    }

    const slide1 = createFakeSource(``)
    updateFrontmatterPatch(slide1.source, { dragPos })
    expectFrontmatter(slide1).toMatchInlineSnapshot(`
      "dragPos:
        foo: 1,2,3,4
      "
    `)

    const slide2 = createFakeSource(`
      # comment
      title: Hello  # another comment
      dragPos:
        bar: 5,6,7,8
    `)
    updateFrontmatterPatch(slide2.source, { dragPos })
    expectFrontmatter(slide2).toMatchInlineSnapshot(`
      "# comment
      title: Hello # another comment
      dragPos:
        foo: 1,2,3,4
      "
    `)

    // remove a field
    const slide3 = createFakeSource(`
      # comment
      title: Hello  # another comment
      dragPos:
        bar: 5,6,7,8
    `)
    updateFrontmatterPatch(slide3.source, { title: null })
    expectFrontmatter(slide3).toMatchInlineSnapshot(`
      "dragPos:
        bar: 5,6,7,8
      "
    `)
  })
})

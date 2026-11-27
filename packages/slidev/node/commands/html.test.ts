import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { expect, it } from 'vitest'
import { getHtmlExportOptions, publishHtml, validateHtmlExportArgs } from './html'

it('resolves HTML settings field by field with CLI precedence', () => {
  expect(getHtmlExportOptions({ 'entry': 'slides.md', 'image-quality': 70 }, {
    maxBytes: 8000000,
    images: { maxWidth: 1920, quality: 85 },
  })).toEqual({
    allowRemote: false,
    maxBytes: 8000000,
    images: { maxWidth: 1920, maxHeight: undefined, quality: 70 },
  })
  for (const value of [
    0,
    -1,
    1.5,
    Number.NaN,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    expect(() => getHtmlExportOptions({ 'entry': 'slides.md', 'max-bytes': value })).toThrow('positive safe integer')
  expect(() => getHtmlExportOptions({ 'entry': 'slides.md', 'image-quality': 101 })).toThrow('between 1 and 100')
})

it('requires explicit remote permission and permits a CLI opt-out', () => {
  expect(getHtmlExportOptions({ entry: 'slides.md' }).allowRemote).toBe(false)
  expect(getHtmlExportOptions({ entry: 'slides.md' }, { allowRemote: true }).allowRemote).toBe(true)
  expect(getHtmlExportOptions({ 'entry': 'slides.md', 'allow-remote': true }, { allowRemote: false }).allowRemote).toBe(true)
  expect(getHtmlExportOptions({ 'entry': 'slides.md', 'allow-remote': false }, { allowRemote: true }).allowRemote).toBe(false)
  expect(() => getHtmlExportOptions({ entry: 'slides.md' }, { allowRemote: 'yes' as unknown as boolean })).toThrow('expected a boolean')
})

it('rejects incompatible explicitly requested flags', () => {
  expect(() => validateHtmlExportArgs({ entry: 'slides.md', range: '1' }, 'html')).toThrow('--range')
  expect(() => validateHtmlExportArgs({ 'entry': 'slides.md', 'max-bytes': 10 }, 'pdf')).toThrow('--max-bytes')
  expect(() => validateHtmlExportArgs({ 'entry': 'slides.md', 'allow-remote': true }, 'pdf')).toThrow('--allow-remote')
  expect(() => validateHtmlExportArgs({ 'entry': 'slides.md', 'allow-remote': false }, 'pdf')).toThrow('--allow-remote')
  expect(() => validateHtmlExportArgs({
    entry: 'slides.md',
    html: { maxBytes: 10 },
  }, 'pdf')).not.toThrow()
})

it('counts final UTF-8 bytes, permits the exact cap and preserves output on failure', async () => {
  const directory = await fs.mkdtemp(join(tmpdir(), 'slidev-html-output-'))
  try {
    const output = join(directory, 'presentation.html')
    const html = '<p>\u00E9</p>'
    const bytes = Buffer.byteLength(html)
    expect(await publishHtml(html, output, bytes)).toBe(bytes)
    await expect(publishHtml('replacement', output, 1)).rejects.toThrow('Existing output preserved')
    expect(await fs.readFile(output, 'utf8')).toBe(html)
    expect(await fs.readdir(directory)).toEqual(['presentation.html'])
  }
  finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

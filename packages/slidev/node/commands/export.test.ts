import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { exportSlides } from './export'

/**
 * `exportSlides` writes to `--output` through several writers, and they used
 * to disagree about whose job it was to create the parent directory:
 * `page.pdf({ path })` creates it, `genPagePng` creates it, and everything
 * calling `fs.writeFile` directly did not. `dist/slides.pptx` then failed
 * with ENOENT while one-piece PDF wrote the same path happily.
 *
 * A real export needs a browser and a dev server, neither of which belongs in
 * a unit test, and it never gets that far here: `importPlaywright` asks
 * `getRoots` for the user root, which throws without an entry, so every call
 * below rejects before anything renders. That is enough, because the
 * directory is created first. The matcher pins each rejection to that known
 * failure, so an error from the `mkdir` itself fails the test instead of
 * satisfying it.
 */

const NO_ENTRY = /Cannot find roots/

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })))
})

async function tempRoot() {
  const root = await fs.mkdtemp(join(tmpdir(), 'slidev-export-'))
  tempRoots.push(root)
  return root
}

function exportInto(output: string, format: 'pdf' | 'pptx' | 'pptx-editable') {
  return exportSlides({ output, format, slides: [], total: 0, waitUntil: undefined })
}

describe('exportSlides creates the output directory', () => {
  it.each([
    ['pptx', 'slides.pptx'],
    ['pptx-editable', 'slides.pptx'],
    ['pdf', 'slides.pdf'],
  ] as const)('creates a missing directory for %s', async (format, filename) => {
    const output = join(await tempRoot(), 'dist', filename)

    await expect(exportInto(output, format)).rejects.toThrow(NO_ENTRY)
    await expect(fs.stat(dirname(output))).resolves.toBeTruthy()
  })

  it('creates nested directories', async () => {
    const output = join(await tempRoot(), 'a', 'b', 'c', 'slides.pptx')

    await expect(exportInto(output, 'pptx')).rejects.toThrow(NO_ENTRY)
    await expect(fs.stat(dirname(output))).resolves.toBeTruthy()
  })

  it('accepts an output with no directory part', async () => {
    // Resolves to the working directory, which exists, so the rejection has
    // to come from the missing entry rather than from the `mkdir`.
    await expect(exportInto('slides.pptx', 'pptx')).rejects.toThrow(NO_ENTRY)
  })
})

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveHandoutOptions } from '../packages/parser/src/config'
import { getExportOptions, resolveHandoutPageInclusion } from '../packages/slidev/node/commands/export'

const tempDirs: string[] = []

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'slidev-handout-'))
  tempDirs.push(dir)
  return dir
}

function createResolvedOptions(roots: string[]) {
  return {
    roots,
    data: {
      slides: [],
      config: {
        export: {},
        exportFilename: '',
        colorSchema: 'auto',
        routerMode: 'history',
        canvasWidth: 980,
        aspectRatio: 16 / 9,
        handout: resolveHandoutOptions(),
      },
    },
  } as any
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('handout export options', () => {
  it('auto-includes cover and ending when lowercase files exist', async () => {
    const dir = await createTempDir()
    await writeFile(join(dir, 'handout-cover.vue'), '<template />')
    await writeFile(join(dir, 'handout-ending.vue'), '<template />')

    expect(resolveHandoutPageInclusion([dir])).toEqual({
      includeCover: true,
      includeEnding: true,
    })
  })

  it('does not include handout extras for missing or uppercase-only files', async () => {
    const dir = await createTempDir()
    await writeFile(join(dir, 'HandoutCover.vue'), '<template />')
    await writeFile(join(dir, 'HandoutEnding.vue'), '<template />')

    expect(resolveHandoutPageInclusion([dir])).toEqual({
      includeCover: false,
      includeEnding: false,
    })
  })

  it('propagates auto-detected extras through getExportOptions', async () => {
    const dir = await createTempDir()
    await writeFile(join(dir, 'handout-cover.vue'), '<template />')

    const options = getExportOptions(
      {
        entry: 'slides.md',
        handout: true,
      },
      createResolvedOptions([dir]),
    )

    expect(options.handout).toBe(true)
    expect(options.includeCover).toBe(true)
    expect(options.includeEnding).toBe(false)
  })
})

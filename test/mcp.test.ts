import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it, vi } from 'vitest'
import { load } from '../packages/parser/src/fs'
import { applySlidePatch, insertSlide, moveSlide, removeSlide } from '../packages/slidev/node/mcp/operations'
import { createSlidevMcpServer } from '../packages/slidev/node/mcp/server'

const ENTRY_MD = `---
theme: default
title: Test Deck
---

# Slide 1

---

# Slide 2

Some content

<!--
note 2
-->

---
layout: two-cols
---

# Slide 3

---
src: ./sub.md
---

---

# Slide 6
`

const SUB_MD = `# Sub 1

---

# Sub 2
`

async function createDeck() {
  const dir = await mkdtemp(join(tmpdir(), 'slidev-mcp-test-'))
  const entry = join(dir, 'slides.md')
  await writeFile(entry, ENTRY_MD, 'utf-8')
  await writeFile(join(dir, 'sub.md'), SUB_MD, 'utf-8')
  const loadData = () => load({ userRoot: dir, roots: [dir] }, entry)
  return { dir, entry, loadData }
}

describe('mcp slide operations', () => {
  it('loads the fixture deck as expected', async () => {
    const { loadData } = await createDeck()
    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 2', 'Slide 3', 'Sub 1', 'Sub 2', 'Slide 6'],
    )
  })

  it('patches slide content and preserves the note', async () => {
    const { loadData } = await createDeck()
    await applySlidePatch(await loadData(), 2, { content: '# Slide 2 Updated' })

    const data = await loadData()
    expect(data.slides[1].content.trim()).toBe('# Slide 2 Updated')
    expect(data.slides[1].note).toBe('note 2')
  })

  it('patches the note and frontmatter of a slide', async () => {
    const { loadData } = await createDeck()
    await applySlidePatch(await loadData(), 3, {
      note: 'a new note',
      frontmatter: { layout: 'center', background: 'blue' },
    })

    let data = await loadData()
    expect(data.slides[2].note).toBe('a new note')
    expect(data.slides[2].frontmatter).toEqual({ layout: 'center', background: 'blue' })

    // `null` deletes a frontmatter key
    await applySlidePatch(data, 3, { frontmatter: { background: null } })
    data = await loadData()
    expect(data.slides[2].frontmatter).toEqual({ layout: 'center' })
  })

  it('patches the entry first slide without breaking the headmatter', async () => {
    const { loadData } = await createDeck()
    await applySlidePatch(await loadData(), 1, { note: 'cover note' })

    const data = await loadData()
    expect(data.headmatter.title).toBe('Test Deck')
    expect(data.slides[0].note).toBe('cover note')
  })

  it('patches a slide imported with src: into its own file', async () => {
    const { dir, loadData } = await createDeck()
    await applySlidePatch(await loadData(), 4, { content: '# Sub 1 Changed' })

    expect(await readFile(join(dir, 'sub.md'), 'utf-8')).toContain('# Sub 1 Changed')
    expect(await readFile(join(dir, 'slides.md'), 'utf-8')).not.toContain('# Sub 1 Changed')
    const data = await loadData()
    expect(data.slides[3].content.trim()).toBe('# Sub 1 Changed')
  })

  it('rejects invalid YAML in frontmatterRaw', async () => {
    const { loadData } = await createDeck()
    await expect(applySlidePatch(await loadData(), 2, { frontmatterRaw: 'foo: [unclosed' }))
      .rejects
      .toThrow(/Invalid YAML/)
  })

  it('rejects out-of-range slide numbers', async () => {
    const { loadData } = await createDeck()
    await expect(applySlidePatch(await loadData(), 99, { content: 'x' }))
      .rejects
      .toThrow(/does not exist/)
  })

  it('inserts a slide after an existing one', async () => {
    const { loadData } = await createDeck()
    await insertSlide(await loadData(), {
      after: 2,
      content: '# Inserted',
      frontmatter: { layout: 'center' },
      note: 'inserted note',
    })

    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 2', 'Inserted', 'Slide 3', 'Sub 1', 'Sub 2', 'Slide 6'],
    )
    expect(data.slides[2].frontmatter).toEqual({ layout: 'center' })
    expect(data.slides[2].note).toBe('inserted note')
  })

  it('inserts a slide at the end of the deck', async () => {
    const { loadData } = await createDeck()
    await insertSlide(await loadData(), { after: 6, content: '# The End' })

    const data = await loadData()
    expect(data.slides.at(-1)?.title).toBe('The End')
  })

  it('removes a slide', async () => {
    const { loadData } = await createDeck()
    await removeSlide(await loadData(), 3)

    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 2', 'Sub 1', 'Sub 2', 'Slide 6'],
    )
  })

  it('refuses to remove the entry first slide (headmatter)', async () => {
    const { loadData } = await createDeck()
    await expect(removeSlide(await loadData(), 1)).rejects.toThrow(/headmatter/)
  })

  it('moves a slide after another one', async () => {
    const { loadData } = await createDeck()
    await moveSlide(await loadData(), { from: 2, after: 6 })

    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 3', 'Sub 1', 'Sub 2', 'Slide 6', 'Slide 2'],
    )
  })

  it('moves a slide before another one', async () => {
    const { loadData } = await createDeck()
    await moveSlide(await loadData(), { from: 3, before: 2 })

    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 3', 'Slide 2', 'Sub 1', 'Sub 2', 'Slide 6'],
    )
  })

  it('moves slides within an imported file', async () => {
    const { loadData } = await createDeck()
    await moveSlide(await loadData(), { from: 5, before: 4 })

    const data = await loadData()
    expect(data.slides.map(s => s.title)).toEqual(
      ['Test Deck', 'Slide 2', 'Slide 3', 'Sub 2', 'Sub 1', 'Slide 6'],
    )
  })

  it('refuses to move slides across files', async () => {
    const { loadData } = await createDeck()
    await expect(moveSlide(await loadData(), { from: 4, before: 2 }))
      .rejects
      .toThrow(/across markdown files/)
  })

  it('refuses to move the entry first slide or insert before it', async () => {
    const { loadData } = await createDeck()
    await expect(moveSlide(await loadData(), { from: 1, after: 2 }))
      .rejects
      .toThrow(/headmatter/)
    await expect(moveSlide(await loadData(), { from: 3, before: 1 }))
      .rejects
      .toThrow(/headmatter/)
  })

  it('requires exactly one of before/after', async () => {
    const { loadData } = await createDeck()
    await expect(moveSlide(await loadData(), { from: 2 }))
      .rejects
      .toThrow(/exactly one/)
    await expect(moveSlide(await loadData(), { from: 2, before: 3, after: 4 }))
      .rejects
      .toThrow(/exactly one/)
  })
})

describe('mcp server', () => {
  async function createServerAndClient(nav?: { getState: () => { page: number, clicks: number }, go: (page: number, clicks: number) => void }) {
    const { entry, loadData } = await createDeck()
    const server = createSlidevMcpServer({
      version: '0.0.0-test',
      entry,
      getData: () => loadData(),
      nav,
    })
    const client = new Client({ name: 'test-client', version: '0.0.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ])
    return { client }
  }

  function textOf(result: any) {
    return result.content[0].text as string
  }

  it('exposes the expected tools', async () => {
    const { client } = await createServerAndClient()
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name).sort()).toEqual([
      'slidev-get-info',
      'slidev-get-slide',
      'slidev-insert-slide',
      'slidev-list-slides',
      'slidev-move-slide',
      'slidev-remove-slide',
      'slidev-update-slide',
    ])
  })

  it('exposes goto-slide only when navigation is available', async () => {
    const { client } = await createServerAndClient({ getState: () => ({ page: 1, clicks: 0 }), go: () => {} })
    const { tools } = await client.listTools()
    expect(tools.map(t => t.name)).toContain('slidev-goto-slide')
  })

  it('gets deck info', async () => {
    const { client } = await createServerAndClient()
    const info = JSON.parse(textOf(await client.callTool({ name: 'slidev-get-info', arguments: {} })))
    expect(info.title).toBe('Test Deck')
    expect(info.totalSlides).toBe(6)
    expect(info.theme).toBe('default')
    expect(info.markdownFiles).toHaveLength(2)
  })

  it('lists slides', async () => {
    const { client } = await createServerAndClient()
    const slides = JSON.parse(textOf(await client.callTool({ name: 'slidev-list-slides', arguments: {} })))
    expect(slides).toHaveLength(6)
    expect(slides[1]).toMatchObject({ no: 2, title: 'Slide 2', hasNote: true })
    expect(slides[3]).toMatchObject({ no: 4, title: 'Sub 1', importedBySrcDirective: true })
  })

  it('gets and updates a slide', async () => {
    const { client } = await createServerAndClient()
    const slide = JSON.parse(textOf(await client.callTool({ name: 'slidev-get-slide', arguments: { no: 3 } })))
    expect(slide).toMatchObject({ no: 3, title: 'Slide 3', layout: 'two-cols' })

    const update = await client.callTool({ name: 'slidev-update-slide', arguments: { no: 3, content: '# Slide 3 via MCP' } })
    expect(update.isError).toBeFalsy()

    const updated = JSON.parse(textOf(await client.callTool({ name: 'slidev-get-slide', arguments: { no: 3 } })))
    expect(updated.content).toBe('# Slide 3 via MCP')
  })

  it('returns tool errors for invalid calls', async () => {
    const { client } = await createServerAndClient()
    const result = await client.callTool({ name: 'slidev-get-slide', arguments: { no: 99 } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toMatch(/does not exist/)
  })

  it('navigates the live presentation', async () => {
    const go = vi.fn()
    const { client } = await createServerAndClient({ getState: () => ({ page: 2, clicks: 1 }), go })

    const result = await client.callTool({ name: 'slidev-goto-slide', arguments: { no: 4 } })
    expect(result.isError).toBeFalsy()
    expect(go).toHaveBeenCalledWith(4, 0)

    const info = JSON.parse(textOf(await client.callTool({ name: 'slidev-get-info', arguments: {} })))
    expect(info.server).toBeUndefined() // no server url in this harness

    await expect(client.callTool({ name: 'slidev-goto-slide', arguments: { no: 99 } }))
      .resolves
      .toMatchObject({ isError: true })
  })
})

import type { LoadedSlidevData } from '@slidev/parser/fs'
import type { SlideInfo, SlidePatch, SourceSlideInfo } from '@slidev/types'
import * as parser from '@slidev/parser/fs'
import YAML from 'yaml'
import { updateFrontmatterPatch } from '../utils'

/**
 * Resolve a rendered slide (1-based, as displayed in the presentation) or
 * throw a descriptive error.
 */
export function resolveSlide(data: LoadedSlidevData, no: number): SlideInfo {
  const slide = data.slides[no - 1]
  if (!slide)
    throw new Error(`Slide ${no} does not exist. The deck has ${data.slides.length} slides (1-${data.slides.length}).`)
  return slide
}

function getMarkdown(data: LoadedSlidevData, source: SourceSlideInfo) {
  const md = data.markdownFiles[source.filepath]
  if (!md)
    throw new Error(`Markdown file not loaded: ${source.filepath}`)
  return md
}

function assertNotEntryHeadmatter(data: LoadedSlidevData, source: SourceSlideInfo, action: string) {
  if (source.filepath === data.entry.filepath && data.entry.slides.indexOf(source) === 0) {
    throw new Error(
      `Cannot ${action} the first slide of the entry file: its frontmatter is the deck headmatter (global configuration). `
      + `Edit its content with the update tool instead, or operate on the following slides.`,
    )
  }
}

export interface SlidePatchResult {
  slide: SlideInfo
  fileContent: string
}

/**
 * Apply a `SlidePatch` to the slide source and save the markdown file.
 *
 * Note this only mutates the *source* slide (`slide.source`), not the
 * rendered `SlideInfo`, so a running dev server will pick up the change from
 * disk like an external edit and push HMR updates to connected clients.
 */
export async function applySlidePatch(
  data: LoadedSlidevData,
  no: number,
  patch: SlidePatch,
): Promise<SlidePatchResult> {
  const slide = resolveSlide(data, no)
  const source = slide.source

  if (patch.content != null)
    source.content = patch.content
  if (patch.frontmatterRaw != null) {
    if (patch.frontmatterRaw.trim() === '') {
      source.frontmatterDoc = source.frontmatterStyle = undefined
    }
    else {
      const parsed = YAML.parseDocument(patch.frontmatterRaw)
      if (parsed.errors.length)
        throw new Error(`Invalid YAML frontmatter: ${parsed.errors.map(e => e.message).join('; ')}`)
      source.frontmatterDoc = parsed
    }
  }
  if (patch.note != null)
    source.note = patch.note
  if (patch.frontmatter)
    updateFrontmatterPatch(source, patch.frontmatter)

  parser.prettifySlide(source)
  const fileContent = await parser.save(getMarkdown(data, source))
  return { slide, fileContent }
}

export interface InsertSlideOptions {
  /**
   * Rendered slide number (1-based) after which the new slide is inserted.
   * The new slide is inserted into the same markdown file as this slide.
   */
  after: number
  content: string
  frontmatter?: Record<string, any>
  note?: string
}

export interface InsertSlideResult {
  source: SourceSlideInfo
  filepath: string
  fileContent: string
}

/**
 * Insert a new slide after an existing one, in the same markdown file.
 */
export async function insertSlide(data: LoadedSlidevData, options: InsertSlideOptions): Promise<InsertSlideResult> {
  const anchor = resolveSlide(data, options.after)
  const md = getMarkdown(data, anchor.source)

  const frontmatter = options.frontmatter ?? {}
  const hasFrontmatter = Object.keys(frontmatter).length > 0
  const doc = hasFrontmatter ? new YAML.Document(frontmatter) : undefined

  const source: SourceSlideInfo = {
    filepath: anchor.source.filepath,
    index: 0, // recomputed on next load
    start: 0,
    contentStart: 0,
    end: 0,
    raw: '',
    revision: '',
    content: options.content,
    contentRaw: options.content,
    frontmatter,
    frontmatterDoc: doc,
    frontmatterStyle: doc ? 'frontmatter' : undefined,
    frontmatterRaw: doc?.toString(),
    note: options.note?.trim() || undefined,
  }
  parser.prettifySlide(source)

  const anchorIdx = md.slides.indexOf(anchor.source)
  md.slides.splice(anchorIdx + 1, 0, source)
  const fileContent = await parser.save(md)
  return { source, filepath: md.filepath, fileContent }
}

export interface RemoveSlideResult {
  removed: SlideInfo
  filepath: string
  fileContent: string
}

/**
 * Remove a slide from its source markdown file.
 */
export async function removeSlide(data: LoadedSlidevData, no: number): Promise<RemoveSlideResult> {
  const slide = resolveSlide(data, no)
  assertNotEntryHeadmatter(data, slide.source, 'remove')
  const md = getMarkdown(data, slide.source)
  const idx = md.slides.indexOf(slide.source)
  if (idx < 0)
    throw new Error(`Slide ${no} is out of sync with its source file. Try again.`)
  md.slides.splice(idx, 1)
  const fileContent = await parser.save(md)
  return { removed: slide, filepath: md.filepath, fileContent }
}

export interface MoveSlideOptions {
  /** Rendered slide number (1-based) of the slide to move */
  from: number
  /** Move the slide right before this rendered slide number */
  before?: number
  /** Move the slide right after this rendered slide number */
  after?: number
}

export interface MoveSlideResult {
  moved: SlideInfo
  anchor: SlideInfo
  filepath: string
  fileContent: string
}

/**
 * Move a slide before or after another slide within the same markdown file.
 */
export async function moveSlide(data: LoadedSlidevData, options: MoveSlideOptions): Promise<MoveSlideResult> {
  const { from, before, after } = options
  if ((before == null) === (after == null))
    throw new Error('Specify exactly one of `before` or `after`.')

  const anchorNo = (before ?? after)!
  if (anchorNo === from)
    throw new Error('The `before`/`after` anchor must be a different slide than `from`.')

  const slide = resolveSlide(data, from)
  const anchor = resolveSlide(data, anchorNo)

  if (slide.source.filepath !== anchor.source.filepath) {
    throw new Error(
      `Cannot move a slide across markdown files: slide ${from} is in "${slide.source.filepath}" `
      + `but slide ${anchorNo} is in "${anchor.source.filepath}" (imported with \`src:\`). `
      + `Move it within its own file, or edit the \`src:\` imports in the entry file manually.`,
    )
  }

  assertNotEntryHeadmatter(data, slide.source, 'move')
  if (before != null)
    assertNotEntryHeadmatter(data, anchor.source, 'insert a slide before')

  const md = getMarkdown(data, slide.source)
  const fromIdx = md.slides.indexOf(slide.source)
  if (fromIdx < 0)
    throw new Error(`Slide ${from} is out of sync with its source file. Try again.`)
  md.slides.splice(fromIdx, 1)
  const anchorIdx = md.slides.indexOf(anchor.source)
  if (anchorIdx < 0)
    throw new Error(`Slide ${anchorNo} is out of sync with its source file. Try again.`)
  md.slides.splice(before != null ? anchorIdx : anchorIdx + 1, 0, slide.source)
  const fileContent = await parser.save(md)
  return { moved: slide, anchor, filepath: md.filepath, fileContent }
}

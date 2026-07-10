import type { Awaitable } from '@antfu/utils'
import type { LoadedSlidevData } from '@slidev/parser/fs'
import type { SlideInfo, SlidevConfig } from '@slidev/types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { applySlidePatch, insertSlide, moveSlide, removeSlide, resolveSlide } from './operations'

export type SlidevMcpData = LoadedSlidevData & { config?: SlidevConfig }

export interface SlidevMcpNav {
  /** Current position of the live presentation */
  getState: () => { page: number, clicks: number }
  /** Navigate all connected clients of the live presentation */
  go: (page: number, clicks: number) => void
}

export interface SlidevMcpContext {
  /** Slidev version */
  version: string
  /** Absolute path of the entry markdown file */
  entry: string
  /** Get the up-to-date slides data */
  getData: () => Awaitable<SlidevMcpData>
  /** URL of the running dev server, if any */
  getServerUrl?: () => string | undefined
  /** Live presentation navigation (only available with a running dev server) */
  nav?: SlidevMcpNav
}

function result(data: any) {
  return {
    content: [{
      type: 'text' as const,
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    }],
  }
}

function slideSummary(slide: SlideInfo) {
  return {
    no: slide.index + 1,
    title: slide.title ?? null,
    ...slide.frontmatter.layout ? { layout: slide.frontmatter.layout } : {},
    file: slide.source.filepath,
    hasNote: !!slide.source.note,
    ...slide.importChain?.length ? { importedBySrcDirective: true } : {},
  }
}

const noSchema = z.number().int().min(1).describe('Slide number (1-based, as displayed in the presentation)')
const frontmatterSchema = z
  .record(z.any())
  .optional()
  .describe('Slide frontmatter (YAML headmatter of the slide) as an object, e.g. { "layout": "two-cols" }')

/**
 * Create the Slidev MCP server exposing tools for agents to inspect, edit,
 * and (with a running dev server) navigate a slides deck.
 *
 * The same tool set is served over the dev server HTTP endpoint (`/__mcp`)
 * and the `slidev mcp` stdio command.
 */
export function createSlidevMcpServer(ctx: SlidevMcpContext): McpServer {
  const server = new McpServer(
    {
      name: 'slidev',
      version: ctx.version,
    },
    {
      instructions: [
        'Tools for working with a Slidev (https://sli.dev) slides deck.',
        'A deck is a Markdown file where slides are separated by `---`; each slide can have YAML frontmatter, Markdown/Vue content, and a speaker note (trailing HTML comment).',
        'Slides are addressed by their rendered 1-based number, matching the slide numbers shown in the presentation.',
        'After editing tools run, a running dev server hot-reloads the presentation automatically.',
      ].join('\n'),
    },
  )

  server.registerTool(
    'get-slidev-info',
    {
      title: 'Get deck info',
      description: 'Get an overview of the Slidev deck: entry file, title, slide count, markdown files, and (when a dev server is running) the server URL and current position of the live presentation.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const data = await ctx.getData()
      const nav = ctx.nav?.getState()
      return result({
        slidevVersion: ctx.version,
        entry: ctx.entry,
        title: data.headmatter.title ?? data.slides[0]?.title ?? null,
        theme: data.config?.theme ?? data.headmatter.theme ?? null,
        totalSlides: data.slides.length,
        markdownFiles: Object.keys(data.markdownFiles),
        ...ctx.getServerUrl?.()
          ? {
              server: {
                url: ctx.getServerUrl(),
                // page 0 means no client has connected yet
                currentPage: nav?.page || null,
                currentClicks: nav?.page ? nav.clicks : null,
              },
            }
          : {},
      })
    },
  )

  server.registerTool(
    'list-slides',
    {
      title: 'List slides',
      description: 'List all slides of the deck with their number, title, layout, and source file. Slides hidden with `hide`/`disabled` frontmatter are not included.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const data = await ctx.getData()
      return result(data.slides.map(slideSummary))
    },
  )

  server.registerTool(
    'get-slide',
    {
      title: 'Get slide',
      description: 'Get the full source of one slide: frontmatter, Markdown content, and speaker note.',
      inputSchema: { no: noSchema },
      annotations: { readOnlyHint: true },
    },
    async ({ no }) => {
      const data = await ctx.getData()
      const slide = resolveSlide(data, no)
      return result({
        ...slideSummary(slide),
        frontmatter: slide.source.frontmatter,
        content: slide.source.content.trim(),
        note: slide.source.note ?? null,
        ...slide.importChain?.length
          ? { importedBy: slide.importChain.map(s => `${s.filepath}#${s.index + 1}`) }
          : {},
      })
    },
  )

  server.registerTool(
    'update-slide',
    {
      title: 'Update slide',
      description: 'Update the content, speaker note, and/or frontmatter of a slide. Only the provided fields are changed. Pass an empty string to clear the content or note. In `frontmatter`, only the given keys are patched; pass `null` as a value to delete that key.',
      inputSchema: {
        no: noSchema,
        content: z.string().optional().describe('New Markdown content of the slide (without frontmatter and note)'),
        note: z.string().optional().describe('New speaker note (Markdown, stored as a trailing HTML comment)'),
        frontmatter: frontmatterSchema,
      },
    },
    async ({ no, content, note, frontmatter }) => {
      if (content == null && note == null && frontmatter == null)
        throw new Error('Nothing to update: provide at least one of `content`, `note`, or `frontmatter`.')
      const data = await ctx.getData()
      const { slide } = await applySlidePatch(data, no, { content, note, frontmatter })
      return result(`Updated slide ${no} in ${slide.source.filepath}.`)
    },
  )

  server.registerTool(
    'insert-slide',
    {
      title: 'Insert slide',
      description: 'Insert a new slide after an existing slide (into the same markdown file). To add a slide at the very end, pass the last slide number.',
      inputSchema: {
        after: z.number().int().min(1).describe('Slide number (1-based) after which the new slide is inserted'),
        content: z.string().describe('Markdown content of the new slide'),
        frontmatter: frontmatterSchema,
        note: z.string().optional().describe('Speaker note of the new slide'),
      },
    },
    async ({ after, content, frontmatter, note }) => {
      const data = await ctx.getData()
      const { filepath } = await insertSlide(data, { after, content, frontmatter, note })
      return result(`Inserted a new slide after slide ${after} in ${filepath}. Slide numbers after it have shifted; list the slides again if needed.`)
    },
  )

  server.registerTool(
    'remove-slide',
    {
      title: 'Remove slide',
      description: 'Remove a slide from the deck (deletes it from its source markdown file).',
      inputSchema: { no: noSchema },
      annotations: { destructiveHint: true },
    },
    async ({ no }) => {
      const data = await ctx.getData()
      const { removed, filepath } = await removeSlide(data, no)
      return result(`Removed slide ${no}${removed.title ? ` ("${removed.title}")` : ''} from ${filepath}. Slide numbers after it have shifted; list the slides again if needed.`)
    },
  )

  server.registerTool(
    'move-slide',
    {
      title: 'Move slide',
      description: 'Move a slide before or after another slide to reorder the deck. Both slides must be in the same markdown file. To swap two adjacent slides, move one after the other.',
      inputSchema: {
        from: z.number().int().min(1).describe('Slide number (1-based) of the slide to move'),
        before: z.number().int().min(1).optional().describe('Move the slide right before this slide number'),
        after: z.number().int().min(1).optional().describe('Move the slide right after this slide number'),
      },
    },
    async ({ from, before, after }) => {
      const data = await ctx.getData()
      const { filepath } = await moveSlide(data, { from, before, after })
      return result(`Moved slide ${from} ${before != null ? `before slide ${before}` : `after slide ${after}`} in ${filepath}. Slide numbers have shifted; list the slides again if needed.`)
    },
  )

  if (ctx.nav) {
    const nav = ctx.nav
    server.registerTool(
      'goto-slide',
      {
        title: 'Go to slide',
        description: 'Navigate the live presentation (all connected browsers) to a given slide, e.g. to visually verify a slide after editing it.',
        inputSchema: {
          no: noSchema,
          clicks: z.number().int().min(0).optional().describe('Click animation step to reveal (defaults to 0)'),
        },
        annotations: { idempotentHint: true },
      },
      async ({ no, clicks }) => {
        const data = await ctx.getData()
        resolveSlide(data, no) // range check
        nav.go(no, clicks ?? 0)
        return result(`Navigated the presentation to slide ${no}${clicks ? ` (click ${clicks})` : ''}.`)
      },
    )
  }

  return server
}

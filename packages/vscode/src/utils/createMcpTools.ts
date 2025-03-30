import type { LoadedSlidevData } from '@slidev/parser/fs'
import type { SlidevMarkdown, SourceSlideInfo } from '@slidev/types'
import { dirname, extname, join } from 'node:path'
import { parseSlide, save as slidevSave } from '@slidev/parser/fs'
import { createKeyedComposable, useActiveTextEditor, useTextEditorSelection } from 'reactive-vscode'
import { FileType, TextEditorSelectionChangeKind, Uri, workspace } from 'vscode'
import { z } from 'zod'
import { getProjectFromDoc } from '../composables/useProjectFromDoc'
import { activeSlidevData } from '../projects'
import { getFirstDisplayedChild } from './getFirstDisplayedChild'

interface Feature {
  name: string
  title: string
  description: string
  depends: string[]
  relates: string[]
  derives: string[]
  tags: string[]
  since?: string
}

interface GithubFile {
  name: string
  download_url: string
}

const getSlidevFeaturesMap = createKeyedComposable(async () => {
  const listResponse = await fetch('https://api.github.com/repos/slidevjs/slidev/contents/docs/features')

  if (!listResponse.ok)
    throw new Error(`Error: Failed to fetch features list (${listResponse.status})`)

  const files = await listResponse.json() as GithubFile[]
  const mdFiles = files.filter(file =>
    file.name.endsWith('.md')
    && file.name !== 'index.md'
    && file.name !== 'features.md',
  )

  const featuresMap = new Map<string, Feature>()
  const derivesMap = new Map<string, string[]>()

  await Promise.all(mdFiles.map(async (file) => {
    try {
      const contentResponse = await fetch(file.download_url)
      if (!contentResponse.ok)
        return

      const content = await contentResponse.text()
      const name = file.name.replace('.md', '')
      const md = parseSlide(content)
      const frontmatter = md.frontmatter

      const depends = frontmatter.depends || []
      for (const depend of depends) {
        const dependName = depend.match(/\/([\w-]+)($|#)/)?.[1]
        if (dependName) {
          if (!derivesMap.has(dependName))
            derivesMap.set(dependName, [])
          derivesMap.get(dependName)!.push(`features/${name}`)
        }
      }

      featuresMap.set(name, {
        name,
        title: md.title || '',
        description: frontmatter.description || '',
        depends: frontmatter.depends || [],
        relates: frontmatter.relates || [],
        derives: frontmatter.derives || [],
        tags: frontmatter.tags || [],
        since: frontmatter.since || '',
      })
    }
    catch (err) {
      throw new Error(`Error processing feature ${file.name}:${String(err)}`)
    }
  }))

  for (const [name, feature] of featuresMap.entries()) {
    if (derivesMap.has(name)) {
      const derives = [...feature.derives]
      for (const derive of derivesMap.get(name)!) {
        if (!derives.includes(derive)) {
          derives.push(derive)
        }
      }
      feature.derives = derives
    }
  }

  const result = Object.fromEntries(featuresMap)
  return result
}, () => `slidev-features-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)

const getSlidevFeatureUsage = createKeyedComposable(async (name: string) => {
  const download_url = `https://raw.githubusercontent.com/slidevjs/slidev/main/docs/features/${name}.md`
  const response = await fetch(download_url)
  if (!response.ok)
    return `Error: Failed to fetch feature usage (${response.status})`
  const content = await response.text()
  const md = parseSlide(content)
  const frontmatter = md.frontmatter
  return JSON.stringify({
    name,
    title: md.title || '',
    description: frontmatter.description || '',
    depends: frontmatter.depends || [],
    relates: frontmatter.relates || [],
    derives: frontmatter.derives || [],
    tags: frontmatter.tags || [],
    since: frontmatter.since || '',
    content: md.content,
  })
}, (name: string) => `slidev-feature-${name}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)

function generateGlobalSlidesInfo(activeSlidevData: LoadedSlidevData) {
  return {
    totalSlides: activeSlidevData.slides.length,
    headmatter: activeSlidevData.headmatter,
    features: activeSlidevData.features,
    allSlideTitles: activeSlidevData.slides.map(s => s.title),
    allSlideNotes: activeSlidevData.slides.map(s => s.note),
  }
}

const getNpmPackages = createKeyedComposable(async (size: number, type: 'theme' | 'addon') => {
  try {
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=keywords:slidev-${type}&size=${size}`)
    if (!response.ok)
      throw new Error(`Error: Failed to get themes (${response.status})`)

    const data = await response.json()
    return JSON.stringify(data.objects.map((item: {
      package: {
        name?: string
        description?: string
      }
    }) => {
      return {
        packageName: item.package.name,
        description: item.package.description,
      }
    }))
  }
  catch (e) {
    throw new Error(`Error: ${String(e)}`)
  }
}, (size: number, type: 'theme' | 'addon') => `slidev-npm-packages-${size}-${type}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)

function getCurrentSlideNo() {
  const editor = useActiveTextEditor()
  const selection = useTextEditorSelection(editor, [TextEditorSelectionChangeKind.Command, undefined])
  const projectInfo = getProjectFromDoc(editor?.value?.document)
  if (!activeSlidevData.value || !projectInfo || !editor.value)
    throw new Error('No active slidev data or project info')
  const line = selection.value.active.line + 1
  const slide = projectInfo.md.slides.find(s => s.start <= line && line <= s.end)
  if (slide) {
    const source = getFirstDisplayedChild(slide)
    return activeSlidevData.value.slides.findIndex(s => s.source === source) + 1
  }
  return -1
}

export const tools = [
  {
    name: 'get-current-slide-no',
    description: 'Get current slide number',
    parameters: z.object({}),
    execute: async () => {
      try {
        const no = getCurrentSlideNo()
        if (activeSlidevData.value && no !== -1) {
          return JSON.stringify({ slideNo: no, totalSlides: activeSlidevData.value.slides.length })
        }
        return 'Error: No slide number found'
      }
      catch (e) {
        return String(e)
      }
    },
  },
  {
    name: 'get-slide',
    description: 'Get slide info by args.slideNo. If args.slideNo is not provided, get the current selected slide.',
    parameters: z.object({
      slideNo: z.number().optional(),
    }),
    execute: async (args: { slideNo?: number }) => {
      if (!activeSlidevData.value)
        return 'Error: No active slidev data or project info'
      let no = args?.slideNo
      if (!no) {
        // if no is not provided, get the current selected slide
        try {
          no = getCurrentSlideNo()
        }
        catch (e) {
          return String(e)
        }
        if (!(activeSlidevData.value && no !== -1)) {
          return 'Error: No slide found'
        }
      }
      // if no is provided, get the slide by number

      if (no > 0 && no <= activeSlidevData.value.slides.length) {
        const slide = activeSlidevData.value.slides[no - 1]
        return JSON.stringify({
          slideNo: no,
          raw: slide.source.raw,
          parsedSlideData: {
            title: slide.title,
            frontmatter: slide.frontmatter,
            note: slide.note,
            content: slide.content,
          },
          globalSlidesInfo: generateGlobalSlidesInfo(activeSlidevData.value),
        })
      }
      else {
        return 'Error: No slide found'
      }
    },
  },
  {
    name: 'get-all-slides',
    description: 'Get all slides info',
    parameters: z.object({}),
    execute: async () => {
      if (!activeSlidevData.value)
        return String('Error: No active slidev data or project info')
      const slides = activeSlidevData.value.slides.map(slide => ({
        slideNo: slide.index + 1,
        title: slide.title,
        frontmatter: slide.frontmatter,
        note: slide.note,
        content: slide.content,
      }))
      return JSON.stringify({
        globalSlidesInfo: {
          totalSlides: activeSlidevData.value.slides.length,
          headmatter: activeSlidevData.value.headmatter,
          features: activeSlidevData.value.features,
        },
        parsedSlidesData: slides,
      })
    },
  },
  {
    name: 'update-slide',
    description: 'Update the slide by args.slideNo. If args.slideNo is not provided, update the current slide. only Update the args that are provided. The headermatter is the frontmatter of the slide 1. Before Update, it\'s better to check the slide info by `get-slide`. Avoid empty lines in HTML blocks as they may be parsed as Markdown.',
    parameters: z.object({
      slideNo: z.number().optional().describe('Slide number to update. If not provided, update the current slide.'),
      raw: z.string().describe('Slidev syntax markdown, including frontmatter and content.'),
    }),
    execute: async (args: {
      slideNo?: number
      raw: string
    }) => {
      if (!activeSlidevData.value)
        return 'Error: No active slidev data or project info'
      let no = args?.slideNo
      if (!no) {
        // if no is not provided, get the current selected slide
        try {
          no = getCurrentSlideNo()
        }
        catch (e) {
          return String(e)
        }
        if (!(activeSlidevData.value && no !== -1)) {
          return 'Error: No slide found'
        }
      }
      // if no is provided, get the slide by number
      if (no > 0 && no <= activeSlidevData.value.slides.length) {
        const entrySlideNo = activeSlidevData.value.slides[no - 1].source.index + 1
        const entrySlideFilePath = activeSlidevData.value.slides[no - 1].source.filepath
        const slidevMarkdown = {
          filepath: entrySlideFilePath,
          slides: activeSlidevData.value.markdownFiles[entrySlideFilePath].slides,
        }
        // only Update the args that are provided

        slidevMarkdown.slides[entrySlideNo - 1].raw = args.raw
        await slidevSave(slidevMarkdown as SlidevMarkdown)
        return JSON.stringify({
          slideNo: no,
          parsedSlideData: parseSlide(args.raw),
        })
      }
      else {
        return 'Error: No slide found'
      }
    },
  },
  {
    name: 'insert-slide',
    description: 'Insert slide by args.slideNo. If args.slideNo is not provided, insert into the current slide. If args.slideNo is -1, add at the end. Avoid empty lines in HTML blocks as they may be parsed as Markdown.',
    parameters: z.object({
      slideNo: z.number().optional().describe('Slide number to insert. If not provided, insert into the current slide. If -1, add at the end.'),
      raw: z.string().describe('Slidev syntax markdown, including frontmatter and content.'),
    }),

    execute: async (args: {
      slideNo?: number
      raw: string
    }) => {
      if (!activeSlidevData.value)
        return 'Error: No active slidev data or project info'
      let no = args?.slideNo
      if (!no) {
        // if no is not provided, get the current selected slide
        try {
          no = getCurrentSlideNo()
        }
        catch (e) {
          return String(e)
        }
        if (!(activeSlidevData.value && no !== -1)) {
          return 'Error: No slide found'
        }
      }
      const entrySlideFilePath = activeSlidevData.value.slides[no - 1].source.filepath
      const slidevMarkdown = {
        filepath: entrySlideFilePath,
        slides: activeSlidevData.value.markdownFiles[entrySlideFilePath].slides,
      }
      // if no is provided, get the slide by number
      if (no > 0 && no <= activeSlidevData.value.slides.length) {
        const entrySlideNo = activeSlidevData.value.slides[no - 1].source.index + 1
        slidevMarkdown.slides.splice(entrySlideNo - 1, 0, { raw: args.raw } as SourceSlideInfo)
      }
      else if (no === -1) {
        slidevMarkdown.slides = [...activeSlidevData.value.entry.slides, { raw: args.raw } as SourceSlideInfo]
      }
      else {
        return 'Error: No slide found'
      }
      await slidevSave(slidevMarkdown as SlidevMarkdown)
      return JSON.stringify({
        slideNo: no,
        parsedSlideData: parseSlide(args.raw),
      })
    },
  },
  {
    name: 'remove-slide',
    description: 'Remove slide by args.slideNo. If args.slideNo is not provided, remove the current slide.',
    parameters: z.object({
      slideNo: z.number().optional().describe('Slide number to remove. If not provided, remove the current slide.'),
    }),
    execute: async (args: { slideNo?: number }) => {
      if (!activeSlidevData.value)
        return 'Error: No active slidev data or project info'
      let no = args?.slideNo
      if (!no) {
        try {
          no = getCurrentSlideNo()
        }
        catch (e) {
          return String(e)
        }
        if (!(activeSlidevData.value && no !== -1)) {
          return 'Error: No slide found'
        }
      }
      if (no > 0 && no <= activeSlidevData.value.slides.length) {
        const entrySlideNo = activeSlidevData.value.slides[no - 1].source.index + 1
        const entrySlideFilePath = activeSlidevData.value.slides[no - 1].source.filepath
        const slidevMarkdown = {
          filepath: entrySlideFilePath,
          slides: activeSlidevData.value.markdownFiles[entrySlideFilePath].slides,
        }
        slidevMarkdown.slides.splice(entrySlideNo - 1, 1)
        await slidevSave(slidevMarkdown as SlidevMarkdown)
        return JSON.stringify({
          result: 'success',
        })
      }
      return 'Error: No slide found'
    },
  },
  {
    name: 'get-slidev-themes',
    description: 'Get slidev theme list. Use `npm install xxx` to install the theme and add theme option on headmatter.',
    parameters: z.object({
      size: z.number().optional().default(20),
    }),
    execute: async (args: { size?: number }) => {
      try {
        const size = args.size || 20
        const res = await getNpmPackages(size, 'theme')
        return res
      }
      catch (error) {
        return String(error)
      }
    },
  },
  {
    name: 'get-slidev-addons',
    description: 'Get slidev addons list. Use `npm install xxx` to install the addon and add addons option on headmatter.',
    parameters: z.object({
      size: z.number().optional().default(20),
    }),
    execute: async (args: { size?: number }) => {
      try {
        const size = args.size || 20
        const res = await getNpmPackages(size, 'addon')
        return res
      }
      catch (error) {
        return String(error)
      }
    },
  },
  {
    name: 'get-layouts',
    description: 'Get all layouts available in Slidev, including both built-in and custom layouts',
    parameters: z.object({}),
    execute: async () => {
      const builtinLayouts = [
        {
          name: 'center',
          description: 'Display content in the center of the screen',
          usage: '---\nlayout: center\n---',
        },
        {
          name: 'cover',
          description: 'Display the cover page of the presentation, including title, speaker, etc.',
          usage: '---\nlayout: cover\n---',
        },
        {
          name: 'default',
          description: 'The most basic layout for displaying any type of content',
          usage: '---\nlayout: default\n---',
        },
        {
          name: 'end',
          description: 'The last page of the presentation',
          usage: '---\nlayout: end\n---',
        },
        {
          name: 'fact',
          description: 'Highlight multiple facts or data on the screen',
          usage: '---\nlayout: fact\n---',
        },
        {
          name: 'full',
          description: 'Use the entire screen space to display content',
          usage: '---\nlayout: full\n---',
        },
        {
          name: 'image-left',
          description: 'Display image on the left side of the screen, content on the right',
          usage: '---\nlayout: image-left\nimage: /path/to/the/image\nclass: my-cool-content-on-the-right\n---',
        },
        {
          name: 'image-right',
          description: 'Display image on the right side of the screen, content on the left',
          usage: '---\nlayout: image-right\nimage: /path/to/the/image\nclass: my-cool-content-on-the-left\n---',
        },
        {
          name: 'image',
          description: 'Display an image as the main content of the page',
          usage: '---\nlayout: image\nimage: /path/to/the/image\nbackgroundSize: contain\n---',
        },
        {
          name: 'iframe-left',
          description: 'Display web page in an iframe on the left side, content on the right',
          usage: '---\nlayout: iframe-left\nurl: https://github.com/slidevjs/slidev\nclass: my-cool-content-on-the-right\n---',
        },
        {
          name: 'iframe-right',
          description: 'Display web page in an iframe on the right side, content on the left',
          usage: '---\nlayout: iframe-right\nurl: https://github.com/slidevjs/slidev\nclass: my-cool-content-on-the-left\n---',
        },
        {
          name: 'iframe',
          description: 'The content of the slide is an embedded web page',
          usage: '---\nlayout: iframe\nurl: https://github.com/slidevjs/slidev\n---',
        },
        {
          name: 'intro',
          description: 'Introduce the presentation, usually with title, brief description, author, etc.',
          usage: '---\nlayout: intro\n---',
        },
        {
          name: 'none',
          description: 'Layout without any styling',
          usage: '---\nlayout: none\n---',
        },
        {
          name: 'quote',
          description: 'Highlight quotations',
          usage: '---\nlayout: quote\n---',
        },
        {
          name: 'section',
          description: 'Mark the beginning of a new section in the presentation',
          usage: '---\nlayout: section\n---',
        },
        {
          name: 'statement',
          description: 'Present a statement/declaration as the main page content',
          usage: '---\nlayout: statement\n---',
        },
        {
          name: 'two-cols',
          description: 'Split the page content into two columns',
          usage: '---\nlayout: two-cols\n---\n\n# Left\n\nThis shows on the left\n\n::right::\n\n# Right\n\nThis shows on the right',
        },
        {
          name: 'two-cols-header',
          description: 'Split the page content into two columns with separate content at top and bottom',
          usage: '---\nlayout: two-cols-header\n---\n\nThis spans both\n\n::left::\n\n# Left\n\nThis shows on the left\n\n::right::\n\n# Right\n\nThis shows on the right',
        },
      ]
      const result = {
        custom: {},
        builtin: {
          layouts: builtinLayouts,
          count: builtinLayouts.length,
        },
      }
      if (activeSlidevData.value) {
        try {
          const slidevFilePath = activeSlidevData.value.entry.filepath
          const projectRoot = dirname(slidevFilePath)
          const layoutsDir = join(projectRoot, 'layouts')

          const layoutsUri = Uri.file(layoutsDir)
          let layoutsExist = false

          try {
            await workspace.fs.stat(layoutsUri)
            layoutsExist = true

            const files = await workspace.fs.readDirectory(layoutsUri)
            const supportedExtensions = ['.vue', '.js', '.ts', '.jsx', '.tsx']

            const customLayouts = files
              .filter(([name, type]) => {
                if (type !== FileType.File)
                  return false

                const ext = extname(name).toLowerCase()
                return supportedExtensions.includes(ext)
              })
              .map(([name]) => {
                return {
                  fileName: name,
                }
              })

            result.custom = {
              layouts: customLayouts,
              exists: layoutsExist,
              count: customLayouts.length,
            }
          }
          catch {
            result.custom = {
              layouts: [],
              exists: false,
              count: 0,
              message: 'Layouts directory does not exist',
            }
          }
        }
        catch (e) {
          result.custom = {
            error: `Error: ${String(e)}`,
          }
        }
      }

      return JSON.stringify(result)
    },
  },
  {
    name: 'get-components',
    description: 'Get all components available in Slidev, including both built-in and custom components.',
    parameters: z.object({}),
    execute: async () => {
      const builtinComponents = [
        {
          name: 'Arrow',
          description: 'Draw an arrow',
          usage: '<Arrow x1="10" y1="20" x2="100" y2="200" />',
          props: [
            { name: 'x1', type: 'string | number', required: true, description: 'Starting x position' },
            { name: 'y1', type: 'string | number', required: true, description: 'Starting y position' },
            { name: 'x2', type: 'string | number', required: true, description: 'Ending x position' },
            { name: 'y2', type: 'string | number', required: true, description: 'Ending y position' },
            { name: 'width', type: 'string | number', default: '2', description: 'Line width' },
            { name: 'color', type: 'string', default: 'currentColor', description: 'Color' },
            { name: 'two-way', type: 'boolean', default: 'false', description: 'Whether to show arrow on both sides' },
          ],
        },
        {
          name: 'VDragArrow',
          description: 'Similar to Arrow component but can be dragged',
          usage: '<VDragArrow x1="10" y1="20" x2="100" y2="200" />',
          props: [
            { name: 'x1', type: 'string | number', required: true, description: 'Starting x position' },
            { name: 'y1', type: 'string | number', required: true, description: 'Starting y position' },
            { name: 'x2', type: 'string | number', required: true, description: 'Ending x position' },
            { name: 'y2', type: 'string | number', required: true, description: 'Ending y position' },
            { name: 'width', type: 'string | number', default: '2', description: 'Line width' },
            { name: 'color', type: 'string', default: 'currentColor', description: 'Color' },
            { name: 'two-way', type: 'boolean', default: 'false', description: 'Whether to show arrow on both sides' },
          ],
        },
        {
          name: 'AutoFitText',
          description: 'Font size will automatically adapt to the content box',
          usage: '<AutoFitText :max="200" :min="100" modelValue="Some text"/>',
          props: [
            { name: 'max', type: 'string | number', default: '100', description: 'Maximum font size' },
            { name: 'min', type: 'string | number', default: '30', description: 'Minimum font size' },
            { name: 'modelValue', type: 'string', default: '\'\'', description: 'Text content' },
          ],
        },
        {
          name: 'LightOrDark',
          description: 'Display different content based on current theme (light or dark)',
          usage: '<LightOrDark>\n  <template #dark>Dark theme in use</template>\n  <template #light>Light theme in use</template>\n</LightOrDark>',
        },
        {
          name: 'Link',
          description: 'Insert a link that can navigate to a specified slide',
          usage: '<Link to="42">Go to slide 42</Link>',
          props: [
            { name: 'to', type: 'string | number', required: true, description: 'Path to navigate to (slides count from 1)' },
            { name: 'title', type: 'string', description: 'Title to display' },
          ],
        },
        {
          name: 'PoweredBySlidev',
          description: 'Add a "Powered by Slidev" badge with a link to the slidev website',
          usage: '<PoweredBySlidev />',
        },
        {
          name: 'RenderWhen',
          description: 'Slot is only rendered when the context satisfies the condition',
          usage: '<RenderWhen context="presenter">This will only show in presenter view.</RenderWhen>',
          props: [
            { name: 'context', type: 'Context | Context[]', required: true, description: 'Required context(s) for rendering' },
          ],
        },
        {
          name: 'SlideCurrentNo',
          description: 'Current slide number',
          usage: '<SlideCurrentNo />',
        },
        {
          name: 'SlidesTotal',
          description: 'Total number of slides',
          usage: '<SlidesTotal />',
        },
        {
          name: 'TitleRenderer',
          description: 'Insert the main title in a slide that is parsed as HTML',
          usage: '<TitleRenderer no="42" />',
          props: [
            { name: 'no', type: 'string | number', required: true, description: 'Slide number to display title for' },
          ],
        },
        {
          name: 'Toc',
          description: 'Insert a table of contents',
          usage: '<Toc />',
          props: [
            { name: 'columns', type: 'string | number', default: '1', description: 'Number of columns to display' },
            { name: 'listClass', type: 'string | string[]', default: '\'\'', description: 'Classes to apply to the TOC list' },
            { name: 'maxDepth', type: 'string | number', default: 'Infinity', description: 'Maximum depth level of headings to display' },
            { name: 'minDepth', type: 'string | number', default: '1', description: 'Minimum depth level of headings to display' },
            { name: 'mode', type: '\'all\' | \'onlyCurrentTree\' | \'onlySiblings\'', default: '\'all\'', description: 'Display mode for TOC items' },
          ],
        },
        {
          name: 'Transform',
          description: 'Apply scale transformation to elements',
          usage: '<Transform :scale="0.5">\n  <YourElements />\n</Transform>',
          props: [
            { name: 'scale', type: 'number | string', default: '1', description: 'Scale ratio' },
            { name: 'origin', type: 'string', default: '\'top left\'', description: 'Origin position' },
          ],
        },
        {
          name: 'Tweet',
          description: 'Embed a tweet',
          usage: '<Tweet id="20" />',
          props: [
            { name: 'id', type: 'number | string', required: true, description: 'Tweet ID' },
            { name: 'scale', type: 'number | string', default: '1', description: 'Scale ratio' },
            { name: 'conversation', type: 'string', default: '\'none\'', description: 'Tweet embed parameter' },
            { name: 'cards', type: '\'hidden\' | \'visible\'', default: '\'visible\'', description: 'Tweet embed parameter' },
          ],
        },
        {
          name: 'VClick',
          description: 'Animation on click',
          usage: '<VClick>Content revealed on click</VClick>',
        },
        {
          name: 'VClicks',
          description: 'Animation on multiple clicks',
          usage: '<VClicks>\n  <div>First</div>\n  <div>Second</div>\n</VClicks>',
        },
        {
          name: 'VSwitch',
          description: 'Switch between slots based on click animations',
          usage: '<VSwitch>\n  <template #default>First</template>\n  <template #1>Second</template>\n  <template #2>Third</template>\n</VSwitch>',
          props: [
            { name: 'unmount', type: 'boolean', default: 'false', description: 'When true, unmount previous slot content' },
            { name: 'tag', type: 'string', default: '\'div\'', description: 'Tag for component' },
            { name: 'childTag', type: 'string', default: '\'div\'', description: 'Tag for child elements' },
            { name: 'transition', type: 'string', default: 'false', description: 'Transition effect' },
          ],
        },
        {
          name: 'VDrag',
          description: 'Element that can be dragged with mouse to move, rotate and resize',
          usage: '<VDrag>Draggable content</VDrag>',
        },
        {
          name: 'SlidevVideo',
          description: 'Embed a video',
          usage: '<SlidevVideo controls>\n  <source src="/myVideo.mp4" type="video/mp4" />\n</SlidevVideo>',
          props: [
            { name: 'controls', type: 'boolean', default: 'false', description: 'Show video controls' },
            { name: 'autoplay', type: 'boolean | \'once\'', default: 'false', description: 'Autoplay video' },
            { name: 'autoreset', type: '\'slide\' | \'click\'', default: 'undefined', description: 'When to reset video' },
            { name: 'poster', type: 'string', default: 'undefined', description: 'Image to show when video not playing' },
            { name: 'printPoster', type: 'string', default: 'undefined', description: 'Override poster for printing' },
            { name: 'timestamp', type: 'string | number', default: '0', description: 'Start time of video (seconds)' },
            { name: 'printTimestamp', type: 'string | number | \'last\'', default: 'undefined', description: 'Override timestamp for printing' },
          ],
        },
        {
          name: 'Youtube',
          description: 'Embed a YouTube video',
          usage: '<Youtube id="luoMHjh-XcQ" />',
          props: [
            { name: 'id', type: 'string', required: true, description: 'YouTube video ID' },
            { name: 'width', type: 'number', description: 'Video width' },
            { name: 'height', type: 'number', description: 'Video height' },
          ],
        },
      ]
      const result = {
        custom: {},
        builtin: {
          components: builtinComponents,
          count: builtinComponents.length,
        },
      }
      if (activeSlidevData.value) {
        try {
          const slidevFilePath = activeSlidevData.value.entry.filepath
          const projectRoot = dirname(slidevFilePath)
          const componentsDir = join(projectRoot, 'components')

          const componentsUri = Uri.file(componentsDir)
          let componentsExist = false

          try {
            await workspace.fs.stat(componentsUri)
            componentsExist = true

            const files = await workspace.fs.readDirectory(componentsUri)
            const supportedExtensions = ['.vue', '.js', '.ts', '.jsx', '.tsx', '.md']

            const customComponents = files
              .filter(([name, type]) => {
                if (type !== FileType.File)
                  return false

                const ext = extname(name).toLowerCase()
                return supportedExtensions.includes(ext)
              })
              .map(([name]) => {
                return {
                  fileName: name,
                }
              })
            result.custom = {
              components: customComponents,
              exists: componentsExist,
              count: customComponents.length,
            }
          }
          catch {
          }
        }
        catch (e) {
          result.custom = {
            error: `Error: ${String(e)}`,
          }
        }
      }

      return JSON.stringify(result)
    },
  },
  {
    name: 'get-slidev-features',
    description: 'Get all Slidev features or search related Slidev features that about layouts, exports, builds, syntax, presentations, animations, code blocks, navigation, styling, drawing, CLI, themes, components, diagrams, editors, remote control, or client APIs.',
    parameters: z.object({
      search: z.string().optional().describe('search for related features'),
    }),
    execute: async (args: { search?: string }) => {
      try {
        const result = await getSlidevFeaturesMap()
        if (args.search) {
          const s = args.search?.toLowerCase().trim()
          return JSON.stringify(Object.values(result).filter((feature) => {
            return (!s || feature.title.toLowerCase().includes(s) || feature.description.toLowerCase().includes(s) || feature.tags.some(tag => tag.toLowerCase().includes(s)))
          }))
        }
        return JSON.stringify(result)
      }
      catch (e) {
        return `Error: ${String(e)}`
      }
    },
  },
  {
    name: 'get-slidev-feature-usage',
    description: 'Get Slidev feature usage.',
    parameters: z.object({
      name: z.string().describe('feature name'),
    }),
    execute: async (args: { name: string }) => {
      try {
        if (!args.name) {
          return 'Error: No feature name provided'
        }
        const res = await getSlidevFeatureUsage(args.name)
        return res
      }
      catch (e) {
        return `Error: ${String(e)}`
      }
    },
  },
]

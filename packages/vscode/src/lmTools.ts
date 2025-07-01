import { slash } from '@antfu/utils'
import { stringifySlide } from '@slidev/parser/core'
import { createSingletonComposable, useDisposable } from 'reactive-vscode'
import { LanguageModelTextPart, LanguageModelToolResult, lm } from 'vscode'
import { useEditingSlideSource } from './composables/useEditingSlideSource'
import { useFocusedSlideNo } from './composables/useFocusedSlideNo'
import { activeEntry, activeProject, projects } from './projects'

export const useLmTools = createSingletonComposable(() => {
  const focusedSlideNo = useFocusedSlideNo()
  const editingSlide = useEditingSlideSource()

  registerSimpleTool('slidev_getActiveSlide', () => {
    const project = activeProject.value

    if (project == null) {
      throw new Error(`No active slide project found.`)
    }

    return formatObject({
      'Entry file': project.entry,
      'Root directory': project.userRoot,
      'Preview server port': project.port || 'Not running',
      'Number of slides': project.data.slides.length,
      'Focused slide no. in presentation (from 1)': focusedSlideNo.value,
      'Editing file': editingSlide.markdown.value?.filepath || 'Not editing',
      'Editing slide index in file (from 0)': editingSlide.index.value,
    })
  })

  registerSimpleTool('slidev_getSlideContent', (input: {
    entrySlidePath: string
    slideNo: number
  }) => {
    const project = resolveProjectFromEntry(input.entrySlidePath)
    const slide = project.data.slides[input.slideNo - 1]

    if (slide == null) {
      throw new Error(`No content found for slide number ${input.slideNo} in entry: ${project.entry}. Available slides numbers: 1-${project.data.slides.length}`)
    }

    return `Content of slide number ${input.slideNo} in entry "${project.entry}" in file "${slide.source.filepath}":\n\n${stringifySlide(slide.source, 1)}`
  })

  // Get all slide titles
  registerSimpleTool('slidev_getAllSlideTitles', (input: { entrySlidePath: string }) => {
    const project = resolveProjectFromEntry(input.entrySlidePath)
    const titles = project.data.slides.map((slide, idx) => `#${idx + 1}: ${slide.title || '(Untitled)'}`)
    return formatList(titles)
  })

  // Find slide number by title
  registerSimpleTool('slidev_findSlideNoByTitle', (input: { entrySlidePath: string, title: string }) => {
    const project = resolveProjectFromEntry(input.entrySlidePath)
    const idx = project.data.slides.findIndex(slide => slide.title === input.title)
    if (idx === -1) {
      throw new Error(`No slide found with title: "${input.title}".`)
    }
    return formatObject({
      'Title': input.title,
      'Slide number': idx + 1,
    })
  })

  // List all loaded Slidev entries
  registerSimpleTool('slidev_listEntries', () => {
    const entries = [...projects.keys()]
    if (entries.length === 0) {
      return 'No loaded Slidev project entries.'
    }
    return formatList(entries)
  })

  // Get project preview port
  registerSimpleTool('slidev_getPreviewPort', (input: { entrySlidePath: string }) => {
    const project = resolveProjectFromEntry(input.entrySlidePath)
    return formatObject({
      'Project entry': project.entry,
      'Preview port': project.port || 'Not running',
    })
  })

  // Choose active Slidev entry
  registerSimpleTool('slidev_chooseEntry', (input: { entrySlidePath: string }) => {
    if (!input.entrySlidePath) {
      throw new Error('entrySlidePath is required.')
    }
    const project = resolveProjectFromEntry(input.entrySlidePath)
    activeEntry.value = project.entry
    return formatObject({
      'Active entry switched to': project.entry,
    })
  })
})

function registerSimpleTool<T>(name: string, invoke: (input: T) => string) {
  useDisposable(lm.registerTool<T>(name, {
    invoke({ input }) {
      try {
        const result = invoke(input)
        return new LanguageModelToolResult([
          new LanguageModelTextPart(result),
        ])
      }
      catch (error: any) {
        return new LanguageModelToolResult([
          new LanguageModelTextPart(`Error: ${error.message || error.toString()}`),
        ])
      }
    },
  }))
}

function resolveProjectFromEntry(entry: string) {
  if (entry === '' || entry === '$ACTIVE_SLIDE_ENTRY') {
    if (!activeEntry.value) {
      throw new Error('No active slide entry found. Please set an active slide entry before using this tool.')
    }
    entry = activeEntry.value
  }

  let project = projects.get(entry)
  if (!project) {
    entry = slash(entry)
    const possibleProjects = [...projects.values()].filter(p => p.entry.includes(entry))
    if (possibleProjects.length === 0) {
      throw new Error(`No project found for entry: ${entry}. All entries: ${formatList(projects.keys())}`)
    }
    else if (possibleProjects.length > 1) {
      throw new Error(`Multiple projects found for entry: ${entry}. Please specify the full path. All entries: ${formatList(projects.keys())}`)
    }
    else {
      project = possibleProjects[0]
    }
  }

  return project
}

function formatList(items: Iterable<string>): string {
  const itemsArray = [...items]
  if (itemsArray.length === 0) {
    return 'No items found.'
  }
  return itemsArray.map(item => `- ${item}\n`).join('')
}

function formatObject(obj: Record<string, string | number>): string {
  return Object.entries(obj)
    .map(([key, value]) => `- ${key}: ${value}\n`)
    .join('')
}

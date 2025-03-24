import type { LoadedSlidevData } from '@slidev/parser/fs'
import type { FastMCP } from 'fastmcp'
import { Buffer } from 'node:buffer'
import { computed, createSingletonComposable, reactive, useActiveTextEditor, useTextEditorSelection, useVscodeContext } from 'reactive-vscode'
import { TextEditorSelectionChangeKind, Uri, window, workspace } from 'vscode'
import { z } from 'zod'
import { mcpIDE, mcpPort, mcpUrl } from '../configs'
import { activeSlidevData } from '../projects'
import { getFirstDisplayedChild } from '../utils/getFirstDisplayedChild'
import { logger } from '../views/logger'
import { getProjectFromDoc } from './useProjectFromDoc'

function generateGlobalSlidesInfo(activeSlidevData: LoadedSlidevData) {
  return {
    totalSlides: activeSlidevData.slides.length,
    headmatter: activeSlidevData.headmatter,
    features: activeSlidevData.features,
    allSlideTitles: activeSlidevData.slides.map(s => s.title),
    allSlideNotes: activeSlidevData.slides.map(s => s.note),
  }
}

const tools = [
  {
    name: 'get-current-slide-no',
    description: 'Get current slide number',
    parameters: z.object({}),
    execute: async () => {
      const editor = useActiveTextEditor()
      const selection = useTextEditorSelection(editor, [TextEditorSelectionChangeKind.Command, undefined])
      const projectInfo = getProjectFromDoc(editor?.value?.document)
      if (!activeSlidevData.value || !projectInfo || !editor.value)
        return String('Error: No active slidev data or project info')
      const line = selection.value.active.line + 1
      const slide = projectInfo.md.slides.find(s => s.start <= line && line <= s.end)
      if (slide) {
        const source = getFirstDisplayedChild(slide)
        const no = activeSlidevData.value.slides.findIndex(s => s.source === source) + 1
        if (no)
          return JSON.stringify({ slideNo: no, totalSlides: activeSlidevData.value.slides.length })
      }
      return 'Error: No slide number found'
    },
  },
  {
    name: 'get-current-slide',
    description: 'Get current slide info',
    parameters: z.object({}),
    execute: async () => {
      const editor = useActiveTextEditor()
      const selection = useTextEditorSelection(editor, [TextEditorSelectionChangeKind.Command, undefined])
      const projectInfo = getProjectFromDoc(editor?.value?.document)
      if (!activeSlidevData.value || !projectInfo || !editor.value)
        return String('Error: No active slidev data or project info')
      const line = selection.value.active.line + 1
      const slide = projectInfo.md.slides.find(s => s.start <= line && line <= s.end)
      if (slide) {
        const source = getFirstDisplayedChild(slide)
        const no = activeSlidevData.value.slides.findIndex(s => s.source === source) + 1
        return JSON.stringify({
          slideNo: no,
          title: slide.title,
          frontmatter: slide.frontmatter,
          note: slide.note,
          content: slide.content,
          globalSlidesInfo: generateGlobalSlidesInfo(activeSlidevData.value),
        })
      }
      return 'Error: No slide found'
    },
  },
  {
    name: 'get-slide-by-no',
    description: 'Get slide info by number',
    parameters: z.object({
      slideNo: z.number(),
    }),
    execute: async (params: { slideNo: number }) => {
      if (!activeSlidevData.value)
        return String('Error: No active slidev data or project info')
      const no = params.slideNo
      if (no > 0 && no <= activeSlidevData.value.slides.length) {
        const slide = activeSlidevData.value.slides[no - 1]
        return JSON.stringify({
          slideNo: no,
          title: slide.title,
          frontmatter: slide.frontmatter,
          note: slide.note,
          content: slide.content,
          globalSlidesInfo: generateGlobalSlidesInfo(activeSlidevData.value),
        })
      }
      return 'Error: No slide found'
    },
  },
  {
    name: 'get-all-slides',
    description: 'Get all slides info',
    parameters: z.object({}),
    execute: async () => {
      const editor = useActiveTextEditor()
      const projectInfo = getProjectFromDoc(editor?.value?.document)
      if (!activeSlidevData.value || !projectInfo || !editor.value)
        return String('Error: No active slidev data or project info')
      const slides = activeSlidevData.value.slides.map(slide => ({
        title: slide.title,
        frontmatter: slide.frontmatter,
        note: slide.note,
        content: slide.content,
      }))
      return JSON.stringify({
        slides,
        globalSlidesInfo: {
          totalSlides: activeSlidevData.value.slides.length,
          headmatter: activeSlidevData.value.headmatter,
          features: activeSlidevData.value.features,
        },
      })
    },
  },
]

/**
 * Update the MCP config for IDEs.
 * This is used to set the MCP server URL for IDEs.
 *
 * @param root Project Root
 * @param type IDE type "cursor" | "vscode"
 * @param url MCP Server URL
 */
export async function updateCursorMcpConfig(root: string, url: string, type: 'cursor' | 'vscode' = 'cursor'): Promise<void> {
  try {
    const cursorDirUri = Uri.file(`${root}/.${type}`)
    const mcpConfigUri = Uri.file(`${root}/.${type}/mcp.json`)

    try {
      await workspace.fs.stat(cursorDirUri)
    }
    catch {
      logger.info(`No .${type} directory found, skipping MCP config update`)
      return
    }

    let mcpConfig: any = {}
    try {
      const mcpData = await workspace.fs.readFile(mcpConfigUri)
      mcpConfig = JSON.parse(Buffer.from(mcpData).toString('utf-8'))
    }
    catch {
      logger.info('Creating new MCP config')
      mcpConfig = {}
    }

    mcpConfig.mcpServers = mcpConfig.mcpServers || {}

    mcpConfig.mcpServers.slidev = { url }

    const configContent = `${JSON.stringify(mcpConfig, null, 2)}\n`
    await workspace.fs.writeFile(
      mcpConfigUri,
      Buffer.from(configContent, 'utf-8'),
    )

    logger.info(`Updated Cursor MCP config at ${mcpConfigUri.fsPath}`)
  }
  catch (error) {
    logger.error('Failed to update Cursor MCP config:', error)
  }
}

// Fastmcp does not support ESM, so we need to use dynamic import
let FastMCPModule: any = null

/**
 * Create a default MCP server
 * @returns {FastMCP}
 */
export async function createMcpServerDefault(): Promise<FastMCP> {
  if (!FastMCPModule) {
    try {
      FastMCPModule = await import('fastmcp')
    }
    catch (error) {
      logger.error('Failed to load FastMCP module:', error)
      window.showErrorMessage(`Failed to load MCP module: ${error}`)
      throw error
    }
  }

  const { FastMCP } = FastMCPModule
  const server = new FastMCP(
    {
      name: 'slidev-vscode',
      version: '1.0.0',
    },
  )
  for (const tool of tools) {
    server.addTool(tool)
  }

  return server
}

export const useMcpServer = createSingletonComposable(() => {
  const state = reactive({
    status: false,
    tools,
  })
  useVscodeContext('slidev:mcp:status', () => state.status)

  let serverInstance: FastMCP | null = null

  async function initServer() {
    if (!serverInstance) {
      serverInstance = await createMcpServerDefault()

      serverInstance.on('connect', (event: any) => {
        logger.info('Client connected:', event.session)
      })

      serverInstance.on('disconnect', (event: any) => {
        logger.info('Client disconnected:', event.session)
      })
    }

    return serverInstance
  }

  /**
   * Start MCP service
   */
  async function start() {
    if (state.status) {
      window.showInformationMessage('MCP Server is already running.')
      return
    }
    try {
      const server = await initServer()
      server.start({
        transportType: 'sse',
        sse: {
          endpoint: '/sse',
          port: mcpPort.value,
        },
      })
      state.status = true
      if (!!mcpIDE.value && workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
        const rootPath = workspace.workspaceFolders[0].uri.fsPath
        await updateCursorMcpConfig(
          rootPath,
          mcpUrl.value,
          mcpIDE.value,
        )
      }
      window.showInformationMessage(`Slidev MCP Server is started, url: ${mcpUrl.value}`)
    }
    catch (error) {
      window.showErrorMessage(`MCP Server Error: ${error}`)
      state.status = false
    }
  }

  /**
   * Stop MCP server
   */
  function stop() {
    if (state.status && serverInstance) {
      serverInstance.stop()
      state.status = false
      window.showInformationMessage('Slidev MCP Server is stopped.')
      logger.info('Slidev MCP Server is stopped.')
    }
    else {
      window.showInformationMessage('Slidev MCP Server is not running.')
    }
  }

  return {
    state,
    server: computed(() => serverInstance),
    url: computed(() => `${mcpUrl.value}/sse`),
    start,
    stop,
  }
})

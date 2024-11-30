import type { MarkdownItShikiOptions } from '@shikijs/markdown-it/index.mjs'
import type { HighlighterGeneric } from 'shiki/types.mjs'
import type { SlidevData } from './types'

export interface RootsInfo {
  cliRoot: string
  clientRoot: string
  userRoot: string
  userPkgJson: Record<string, any>
  userWorkspaceRoot: string
}

export interface SlidevEntryOptions {
  /**
   * Markdown entry
   */
  entry: string

  /**
   * Theme id
   */
  theme?: string

  /**
   * Remote password
   */
  remote?: string

  /**
   * Enable inspect plugin
   */
  inspect?: boolean

  /**
   * Build with --download option
   */
  download?: boolean
}

export interface ResolvedSlidevOptions extends RootsInfo, SlidevEntryOptions {
  data: SlidevData
  themeRaw: string
  themeRoots: string[]
  addonRoots: string[]
  /**
   * =`[...themeRoots, ...addonRoots, userRoot]` (`clientRoot` excluded)
   */
  roots: string[]
  mode: 'dev' | 'build' | 'export'
  utils: ResolvedSlidevUtils
}

export interface ResolvedSlidevUtils {
  shiki: HighlighterGeneric<any, any>
  shikiOptions: MarkdownItShikiOptions
  indexHtml: string
  define: Record<string, string>
  iconsResolvePath: string[]
  isMonacoTypesIgnored: (pkg: string) => boolean
  getLayouts: () => Record<string, string>
}

export interface SlidevServerOptions {
  /**
   * @returns `false` if server should be restarted
   */
  loadData?: (loadedSource: Record<string, string>) => Promise<SlidevData | false>
}

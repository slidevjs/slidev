import type { MarkdownItShikiOptions } from '@shikijs/markdown-it'
import type { KatexOptions } from 'katex'
import type { CodeOptionsThemes, ShorthandsBundle } from 'shiki/core'
import type { SlidevData } from './types'

export interface RootsInfo {
  cliRoot: string
  clientRoot: string
  userRoot: string
  /**
   * Directory of the closest `package.json` at or above `userRoot`.
   * Equals `userRoot` when the entry sits next to the `package.json`,
   * and is an ancestor of it when the entry lives in a subdirectory.
   */
  userProjectRoot: string
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

  /**
   * Base URL in dev or build mode
   */
  base?: string

  /**
   * Exclude speaker notes from the built output
   */
  withoutNotes?: boolean

  /**
   * Override routerMode at build time
   */
  routerMode?: 'hash' | 'history' | 'memory'
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
  /**
   * Roots to look up `setup/*` files in.
   * =`[...themeRoots, ...addonRoots, userProjectRoot, userRoot]`
   *
   * `setup/*` filenames are owned by Slidev, so they are also read from
   * `userProjectRoot`. That keeps them working when the entry markdown lives
   * in a subdirectory of the project. Generically named files (`components/`,
   * `layouts/`, `styles/`, `uno.config.ts`, `vite.config.ts`) stay on `roots`.
   */
  setupRoots: string[]
  mode: 'dev' | 'build' | 'export'
  utils: ResolvedSlidevUtils
}

export interface ResolvedSlidevUtils {
  shiki: ShorthandsBundle<string, string>
  shikiOptions: MarkdownItShikiOptions & CodeOptionsThemes
  katexOptions: KatexOptions | null
  indexHtml: string
  define: Record<string, string>
  iconsResolvePath: string[]
  isMonacoTypesIgnored: (pkg: string) => boolean
  getLayouts: () => Promise<Record<string, string>>
}

export interface SlidevServerOptions {
  /**
   * @returns `false` if server should be restarted
   */
  loadData?: (loadedSource: Record<string, string>) => Promise<SlidevData | false>
}

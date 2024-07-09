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
}

export interface ResolvedSlidevOptions extends RootsInfo {
  data: SlidevData
  entry: string
  themeRaw: string
  theme: string
  themeRoots: string[]
  addonRoots: string[]
  /**
   * =`[...themeRoots, ...addonRoots, userRoot]` (`clientRoot` excluded)
   */
  roots: string[]
  mode: 'dev' | 'build' | 'export'
  remote?: string
  inspect?: boolean
  utils: ResolvedSlidevUtils
}

export interface ResolvedSlidevUtils {
  isMonacoTypesIgnored: (pkg: string) => boolean
  getLayouts: () => Promise<Record<string, string>>
}

export interface SlidevServerOptions {
  /**
   * @returns `false` if server should be restarted
   */
  loadData?: () => Promise<SlidevData | false>
}

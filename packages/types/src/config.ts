import type { ExportArgs } from './cli'
import type { HeadmatterConfig } from './frontmatter'

export interface ResolvedSlidevConfigSub {
  export: ResolvedExportOptions
  drawings: ResolvedDrawingsOptions
  fonts: ResolvedFontOptions
}

export interface SlidevConfig extends
  Omit<Required<HeadmatterConfig>, keyof ResolvedSlidevConfigSub>,
  ResolvedSlidevConfigSub {
}

export interface ResolvedFontOptions {
  sans: string[]
  mono: string[]
  serif: string[]
  weights: string[]
  italic: boolean
  provider: 'none' | 'google'
  webfonts: string[]
  local: string[]
}

export interface ResolvedDrawingsOptions {
  persist: string | false
  enabled: boolean | 'dev' | 'build'
  presenterOnly: boolean
  syncAll: boolean
}

export interface ResolvedExportOptions extends Omit<ExportArgs, 'entry' | 'theme'> {
  withClicks?: boolean
  executablePath?: string
  withToc?: boolean
}

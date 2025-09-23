import type { ExportArgs } from './cli'
import type { HeadmatterConfig } from './frontmatter'

export interface ResolvedSlidevConfigSub {
  export: ResolvedExportOptions
  drawings: ResolvedDrawingsOptions
  fonts: ResolvedFontOptions
  aspectRatio: number
  handout: ResolvedHandoutOptions
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
  provider: 'none' | 'google' | 'coollabs'
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

export interface ResolvedHandoutOptions {
  size: string
  orientation: 'portrait' | 'landscape'
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  cssPageSize: string
  margins: HandoutPageMargins
  coverMargins: HandoutPageMargins
}

export interface HandoutPageMargins {
  top: string
  right: string
  bottom: string
  left: string
}

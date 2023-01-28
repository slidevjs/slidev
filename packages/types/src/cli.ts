export interface CommonArgs {
  entry: string
  theme?: string
}

export interface ExportArgs extends CommonArgs {
  output?: string
  format?: string
  timeout?: number
  range?: string
  dark?: boolean
  'with-clicks'?: boolean
  'executable-path'?: string
  'with-toc'?: boolean
  'per-slide'?: boolean
}

export interface BuildArgs extends ExportArgs {
  watch: boolean
  out: string
  base?: string
  download?: boolean
  inspect: boolean
}

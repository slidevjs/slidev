export interface CommonArgs {
  entry: string
  theme?: string
}

export interface ExportArgs extends CommonArgs {
  'output'?: string
  'format': string
  'template': string
  'base': string
  'timeout': number
  'wait': number
  'range': string
  'dark'?: boolean
  'with-clicks': boolean
  'executable-path'?: string
  'with-toc': boolean
  'per-slide': boolean
  'scale': number
}

export interface BuildArgs extends ExportArgs {
  watch: boolean
  out: string
  download?: boolean
  inspect: boolean
}

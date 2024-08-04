export interface CommonArgs {
  entry: string
  theme?: string
}

export interface ExportArgs extends CommonArgs {
  'output'?: string
  'format'?: string
  'timeout'?: number
  'wait'?: number
  'wait-until'?: string
  'range'?: string
  'dark'?: boolean
  'with-clicks'?: boolean
  'executable-path'?: string
  'with-toc'?: boolean
  'per-slide'?: boolean
  'scale'?: number
  'omit-background'?: boolean
}

export interface BuildArgs extends ExportArgs {
  out: string
  base?: string
  download?: boolean
  inspect: boolean
}

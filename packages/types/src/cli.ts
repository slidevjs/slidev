export interface CommonArgs {
  entry: string
  theme?: string
}

export interface ExportArgsHandout extends CommonArgs {
  output?: string
  format?: string
  timeout?: number
  range?: string
  dark?: boolean
  cover?: boolean
  'with-clicks'?: boolean
  'executable-path'?: string
  'per-slide'?: boolean
  'slide-format'?: string
  'jpeg-image-quality'?: number
  'write-slide-images-to-disk'?: boolean
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

export interface CommonArgs {
  entry: string
  theme?: string
}

export interface HtmlExportOptions {
  allowRemote?: boolean
  maxBytes?: number
  images?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
}

export interface ExportArgs extends CommonArgs {
  'html'?: HtmlExportOptions
  'allow-remote'?: boolean
  'max-bytes'?: number
  'image-max-width'?: number
  'image-max-height'?: number
  'image-quality'?: number
  'without-notes'?: boolean
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
  'out': string
  'base'?: string
  'download'?: boolean
  'inspect': boolean
  'without-notes'?: boolean
}

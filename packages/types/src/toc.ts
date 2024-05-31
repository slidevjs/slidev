export interface TocItem {
  no: number
  active?: boolean
  activeParent?: boolean
  children: TocItem[]
  hasActiveParent?: boolean
  level: number
  titleLevel: number
  path: string
  hideInToc?: boolean
  title?: string
}

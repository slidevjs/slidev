export interface TocItem {
  active?: boolean
  activeParent?: boolean
  children: TocItem[]
  hasActiveParent?: boolean
  level: number
  path: string
  hideInToc?: boolean
  title?: string
}

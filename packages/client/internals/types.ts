export interface SelectionItem<T> {
  value: T
  display: string
  onClick?: () => void
}

import type { Component } from 'vue'

type ContextMenuOption = {
  action: () => void
  disabled?: boolean
} & (
  | {
    small?: false
    icon?: Component
    label: string | Component
  }
  | {
    small: true
    icon: Component
    label: string
  }
  )

export type ContextMenuItem = ContextMenuOption | 'separator'
